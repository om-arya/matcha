from google import genai
from gemini_api_key import gemini_api_key
import text_to_speech as tts
import time

# https://ai.google.dev/gemini-api/docs/image-understanding

client = genai.Client(api_key = gemini_api_key)

"""
Given a filepath to an image, if the image is a chart,
return a summary. Otherwise, return N/A.
"""
def summarize_chart(filepath):
    try:
        image_file = client.files.upload(file = filepath)

        prompt = """
        You are a screen reader and came across this image.
        If it is a data visualization (e.g. graph, chart, etc.):
            Give 1-2 sentences about the main features of the visualization including the title (if applicable),
            maximum(s), minimum(s), and general trend(s), as well as any key insight(s).
            Start it with "A [visualization type] shows…" or "A [visualization type] titled [title] shows…"
        Otherwise:
            Simply output "N/A"
        """

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[image_file, prompt]
        )

        return response.text
    except:
        return "N/A"

# Example usage
if __name__ == "__main__":
    res = summarize_chart("./testimg.png")
    tts.tts_play(res)
    time.sleep(20)