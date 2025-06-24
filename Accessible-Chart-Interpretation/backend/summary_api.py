from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests, mimetypes, base64
import json
from GEMINI_API_KEY import GEMINI_API_KEY

origins = ['*']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of origins allowed to make requests
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],    # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allow all headers in the request
)

# Run on a local server via 'uvicorn summary_api:app --reload'
# Then, go to the URL Uvicorn indicates its running on; mine is http://127.0.0.1:8000

"""
Given a file path to an image, if the image is a chart,
return a text summary of the key features.

Otherwise, return "N/A".
"""
@app.get("/get_summary")
def summarize_chart(image_path):
    try:
        # Fetch the image over HTTP
        r = requests.get(image_path, timeout=10)
        r.raise_for_status()
        image_data = r.content # bytes

        # Guess MIME type from the URL if the server didn’t send one
        mime_type = r.headers.get("Content-Type") or mimetypes.guess_type(image_path)[0] or "application/octet-stream"

        b64_data = base64.b64encode(image_data).decode()

        # Construct the prompt for the Gemini API
        prompt = (
            "You are a screen reader and came across this image. "
            "If it is a data visualization (e.g. graph, chart, etc.): "
            "Give 1-2 sentences about the main features of the visualization including the title (if applicable), "
            "maximum(s), minimum(s), and general trend(s), as well as any key insight(s). "
            "Start it with \"A [visualization type] shows…\" or \"A [visualization type] titled [title] shows…\" "
            "Otherwise: Simply output \"N/A\""
        )

        # Build the request body to send to the Gemini API
        request_body = {
            "contents": [
                {
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": b64_data,
                            }
                        },
                        {"text": prompt},
                    ]
                }
            ]
        }

        # Make the request to the Gemini API
        url = (
            f"https://generativelanguage.googleapis.com/v1/models/"
            f"gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
        )
        headers = {"Content-Type": "application/json"}
        response = requests.post(url, headers=headers, data=json.dumps(request_body))
        response.raise_for_status() # Raise an exception if the request returned an error status

        data = response.json()

        # Extract and return the summary text from the API response
        summary = (
            data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "ERR")
        )

        return summary
    except Exception as err:
        print("Summarization failed:", err)
        return "ERR"