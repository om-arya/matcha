import os
import pandas as pd
import google.generativeai as genai
from redesign_service.redesign_service import find_and_fix_flaws
from generate_graphs import generate_graph_from_matplotlib_code
from semantic_similarity_service.semantic_similarity_service import compute_semantic_similarity
from GEMINI_API_KEY import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)
client = genai.GenerativeModel('gemini-2.5-flash')

def generate_image_understanding_response(prompt: str, image_filepath: str):
    result = client.generate_content(
        [prompt, {
            "mime_type": "image/png",
            "data": open(image_filepath, "rb").read()
        }]
    )
    candidate = result.candidates[0]
    return candidate.content.parts[0].text.strip()

def generate_summary(image_filepath: str):
    prompt = """
        You are a screen reader and came across this data visualization.
        Describe it in 1-2 sentences using simple, friendly language.
        Mention what kind of visualization it is, its title (if any), any highs and lows,
        and what the overall pattern seems to be.
        Start with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
        If it is not a data visualization, say "N/A”.
    """
    return generate_image_understanding_response(prompt, image_filepath)

# Ensure graphs directory exists
os.makedirs("./graphs", exist_ok=True)

def run_robustness_study(input_csv="github_matplotlib_audit.csv", output_csv="robustness_study.csv", num_rows=10):
    df = pd.read_csv(input_csv)
    
    # Slice the dataframe to only the first `num_rows` rows if specified
    if num_rows is not None:
        df = df.head(num_rows)
    
    results = []
    
    for _, row in df.iterrows():
        repo = row["repo"]
        filename = row["filename"].replace(".py", "")
        mpl_code = row["code"]
        base_filename = f"{repo.replace('/', '_')}_{filename}"
        
        # Step 1: Fix flaws
        print("Step1")
        fixed_code = find_and_fix_flaws(mpl_code)
        
        # Step 2: Render graphs
        orig_image = generate_graph_from_matplotlib_code(mpl_code, f"{base_filename}_original.png")
        fixed_image = generate_graph_from_matplotlib_code(fixed_code, f"{base_filename}_fixed.png")
        
        # Step 3: Generate summaries
        orig_summary = generate_summary(orig_image) if orig_image else None
        fixed_summary = generate_summary(fixed_image) if fixed_image else None
        
        # Step 4: Compute semantic similarity
        similarity = None
        if orig_summary and fixed_summary:
            similarity = compute_semantic_similarity(orig_summary, fixed_summary)
        print(f"Computed similarity between {orig_image} and {fixed_image} summaries: {similarity}")
        
        results.append({
            "repo": repo,
            "filename": filename,
            "original_image": orig_image,
            "fixed_image": fixed_image,
            "original_summary": orig_summary,
            "fixed_summary": fixed_summary,
            "semantic_similarity": similarity
        })
    
    # Write results to CSV
    pd.DataFrame(results).to_csv(output_csv, index=False)
    print(f"Robustness study results saved to {output_csv}")

if __name__ == "__main__":
    run_robustness_study(num_rows=3)