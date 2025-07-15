from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import re
import google.generativeai as genai
import json

from GEMINI_API_KEY import GEMINI_API_KEY

app = FastAPI()

origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of origins allowed to make requests
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],    # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allow all headers in the request
)

genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel('gemini-2.5-flash')

def generate_response(prompt: str):
    result = client.generate_content(prompt)
    candidate = result.candidates[0]
    return candidate.content.parts[0].text.strip()

@app.get("/find_flaws")
def find_flaws(mpl_file: str):
    flaws = []

    # Check if matplotlib is imported
    mpl_index = mpl_file.find("import matplotlib")
    if mpl_index == -1:
        mpl_index = mpl_file.find("from matplotlib import")
    if mpl_index == -1:
        return flaws

    scan_text = mpl_file[mpl_index:]

    # Descriptive Labels
    for fn in ["title", "xlabel", "ylabel"]:
        match = re.search(rf"{fn}\s*\(\s*['\"]([^'\"]*)['\"]", scan_text)
        if match:
            txt = match.group(1).strip().lower()
            if not txt or txt in ["x", "y", "series 1"]:
                flaws.append(f"MISSING_{fn.upper()}")
        else:
            flaws.append(f"MISSING_{fn.upper()}")

    # Legend required when multiple series plotted
    plot_count = len(re.findall(r'plot\s*\(', scan_text))
    scatter_count = len(re.findall(r'scatter\s*\(', scan_text))
    if (plot_count + scatter_count > 1) and 'legend(' not in scan_text:
        flaws.append("MISSING_LEGEND")

    # Minimum Font Size (>= 15)
    font_matches = re.findall(r'fontsize\s*=\s*(\d+)', scan_text)
    if any(int(size) < 15 for size in font_matches):
        flaws.append("FONTSIZE_TOO_SMALL")

    # Minimum Figure Size (>= 8x5)
    fig_match = re.search(r'figsize\s*=\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)', scan_text)
    if fig_match:
        w, h = float(fig_match.group(1)), float(fig_match.group(2))
        if w < 8 or h < 5:
            flaws.append("FIGSIZE_TOO_SMALL")

    # High-contrast colors only
    color_matches = re.findall(r'color\s*=\s*[\'"]([^\'"]+)[\'"]', scan_text)
    safe_colors = {
        "#000000", "#0072B2", "#009E73", "#D55E00",
        "black", "blue", "green", "orange"
    }
    if any(color.lower() not in safe_colors for color in color_matches):
        flaws.append("INSUFFICIENT_COLOR_CONTRAST")

    # No animations allowed
    if "FuncAnimation" in scan_text or "animation." in scan_text:
        flaws.append("ANIMATIONS")

    # Inverted Y-axis
    if re.search(r'\.\s*invert_yaxis\s*\(', scan_text):
        flaws.append("INVERTED_Y_AXIS")

    # Truncated Y-axis (not starting at 0)
    for match in re.finditer(r'(?:set_)?ylim\s*\(\s*([\-]?\d+(?:\.\d+)?)\s*,', scan_text):
        lower = float(match.group(1))
        if abs(lower) > 1e-6:
            flaws.append("TRUNCATED_Y_AXIS")
            break

    # 3D Effects
    if (re.search(r'["\']\s*3d\s*["\']', scan_text) or
        "Axes3D" in scan_text or
        "plot_surface(" in scan_text):
        flaws.append("3D_EFFECTS")

    # Tampered aspect ratio
    fig_aspect = re.search(r'figsize\s*=\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*\)', scan_text)
    if fig_aspect:
        w, h = float(fig_aspect.group(1)), float(fig_aspect.group(2))
        if h != 0:
            ratio = w / h
            if ratio < 0.5 or ratio > 2.0:
                flaws.append("TAMPERED_ASPECT_RATIO")
    if re.search(r'set_aspect\s*\(|aspect\s*=', scan_text):
        flaws.append("TAMPERED_ASPECT_RATIO")

    # Dual Y-axes
    if re.search(r'twin[xy]\s*\(', scan_text) or 'secondary_y=True' in scan_text:
        flaws.append("DUAL_Y_AXES")

    contextual_flaws_prompt = f"""
       You are an expert in data visualization integrity. I will provide you with:

        1. A list of misleading visualization rules (each with a RULE_CODE and description),
        2. A Matplotlib code snippet that generates a chart.

        Your task:
        - Analyze the code and detect which rules are violated based solely on what can be inferred from the code itself (e.g., axis behavior, titles, aspect ratio, annotations).
        - Output only the list of violated RULE_CODEs in this format: [RULE_CODE1, RULE_CODE2, ...]
        - If the graph does not violate any rules, return: NONE

        Rule Codes and Descriptions:

        BIASED_TITLE:
        A graph uses a biased or emotionally slanted title that influences interpretation before data is analyzed.

        MISLEADING_ANNOTATIONS:
        Annotations suggest causality or relationships that are not statistically or contextually justified.

        DECEPTIVE_LABELS:
        Y-axis or x-axis labels are vague, reversed, or omit key categories, leading to confusion.

        FRAMING_BIAS:
        External context or textual framing (e.g., comments, hashtags, plot subtitles) introduces bias not reflected in the graph.

        INVERTED_AXES:
        Y-axis is reversed (top to bottom), which misleads users by flipping the meaning of increases/decreases.

        TRUNCATED_AXES:
        Y-axis does not start at zero, which exaggerates visual differences.

        ASPECT_RATIO_DISTORTION:
        Aspect ratio is altered (e.g., too stretched or squished), making trends look steeper or flatter than they are.

        DUAL_AXES:
        Chart uses two different y-axes that may falsely suggest correlation between unrelated data series.

        NON_SEQUENTIAL_AXIS:
        X or Y axis uses a non-logical or out-of-order sequence (e.g., age ranges like 18-34, 45-55, 35-44).

        Matplotlib Code:
        {mpl_file}
    """

    contextual_flaws = generate_response(contextual_flaws_prompt)
    flaws = flaws + contextual_flaws

    return flaws

@app.get("/find_and_fix_flaws")
def find_and_fix_flaws(mpl_file: str):
    flaws = find_flaws(mpl_file)

    fixed_file_prompt = f"""
        I will present a list of flaws, followed by a Matplotlib file containing those flaws.
        Output the Matplotlib file with the flaws removed.

        Flaws: {flaws}

        Matplotlib file:
        {mpl_file}
    """

    fixed_file = generate_response(fixed_file_prompt)
    return fixed_file

@app.get("/insert_flaws")
def insert_flaws(mpl_file: str, flaws: list[str]):
    existing_flaws = find_flaws(mpl_file)
    new_flaws = []
    for flaw in flaws:
        if flaw not in existing_flaws:
            new_flaws.append(flaw)

    flawed_file_prompt = f"""
        I will present a list of flaws, followed by a Matpotlib file.
        Output the Matplotlib file with the flaws inserted into it.
        
        Flaws: {new_flaws}

        Matplotlib file:
        {mpl_file}
    """

    flawed_file = generate_response(flawed_file_prompt)
    return flawed_file

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("redesign_service:app", host="127.0.0.1", port=8001, reload=True)