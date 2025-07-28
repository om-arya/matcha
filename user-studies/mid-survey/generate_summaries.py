import google.generativeai as genai
import os
import csv
import time
from GEMINI_API_KEY import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

prompts = {
    "Concise and Factual": """
        You are a screen reader and came across this data visualization.
        In 1–2 short, fact-based sentences, describe the visualization by stating the visualization type,
        title (if applicable), key maximum(s), minimum(s), and trend(s) with no interpretation or opinion.
        Start with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
        If it is not a data visualization, simply output "N/A".
    """,

    "Friendly and Approachable": """
        You are a screen reader and came across this data visualization.
        Describe it in 1–2 sentences using simple, friendly language.
        Mention what kind of visualization it is, its title (if any), any highs and lows, and what the
        overall pattern seems to be.
        Start with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
        If it is not a data visualization, say "N/A".
    """,

    "Technical and Detailed": """
        You are a screen reader and encountered this data visualization.
        In 2-5 sentences, include the visualization type, title (if applicable), axes information (if readable),
        peak and low values with specific data points if available, directionality of trends,
        and any outliers or anomalies.
        Begin with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
        If not a data visualization, return "N/A".
    """,

    "Insightful and Analytical": """
        You are a screen reader and came across this data visualization.
        Give 1-2 sentences about the main features of the visualization including the title (if applicable),
        maximum(s), minimum(s), and general trend(s), as well as any key insight(s).
        Start it with "A [visualization type] shows…" or \"A [visualization type] titled [title] shows…"
        If it is not a data visualization, simply output "N/A".
    """,

    "Casual and Humorous": """
        You're a screen reader with a sense of humor, and you just came across this data visualization.
        Give a laid-back, fun 1-2 sentence summary that still covers the basics: what kind of visualization it is,
        the title if it has one, what goes up, what goes down, and any surprising twists.
        Start with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
        If it’s not a data visualization, just say "N/A" and move on.
    """,

    "Neutral and Objective": """
        You are a screen reader encountering a data visualization.
        Provide a neutral, unbiased summary in 1–2 sentences.
        Mention the type of visualization, title (if applicable), main trends, and the highest and lowest values
        without adding interpretation or judgment.
        Begin with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
        If the image is not a data visualization, respond with "N/A".
    """
}

# Helper: Load image and encode for Gemini
def load_image_for_gemini(image_path):
    with open(image_path, "rb") as img_file:
        img_data = img_file.read()
    mime_type = "image/png" if image_path.lower().endswith(".png") else "image/jpeg"
    return {
        "mime_type": mime_type,
        "data": img_data
    }

# Generate summary for one image with all prompts
def generate_summaries_for_image(image_path):
    image_data = load_image_for_gemini(image_path)
    summaries = {}
    for style, prompt in prompts.items():
        try:
            response = model.generate_content([prompt, image_data])
            summaries[style] = response.text.strip()
            print(f"{style}: {summaries[style]} \n")
        except Exception as e:
            print(f"Error: {str(e)}; retrying")
            generate_summaries_for_image(image_path)
    return summaries

def generate_summaries():
    image_dir = "./graphs"
    output_csv = "summaries.csv"
    image_extensions = [".png", ".jpg"]

    # Get and sort image files alphabetically
    image_filenames = sorted(
        f for f in os.listdir(image_dir)
        if any(f.lower().endswith(ext) for ext in image_extensions)
    )

    rows = []
    for filename in image_filenames:
        image_path = os.path.join(image_dir, filename)
        print(f"------------ Processing: {filename} ------------ \n")
        summary = generate_summaries_for_image(image_path)
        row = {"Image Filename": filename}
        row.update(summary)
        rows.append(row)
        print(f"------------ Successfully processed: {filename} ------------ \n")

    # Write to CSV
    fieldnames = ["Image Filename"] + list(prompts.keys())
    with open(output_csv, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"Summaries written to {output_csv}")

if __name__ == "__main__":
    generate_summaries()