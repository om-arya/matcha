from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import torch
import requests, mimetypes, base64
import json

from services.summary_service.GEMINI_API_KEY import GEMINI_API_KEY

app = FastAPI()

origins = ['*']

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
def summarize_chart(image_path: str, prompt: str):
    try:
        # Fetch the image over HTTP
        r = requests.get(image_path, timeout=10)
        r.raise_for_status()
        image_data = r.content # bytes

        # Guess MIME type from the URL if the server didn’t send one
        mime_type = r.headers.get("Content-Type") or mimetypes.guess_type(image_path)[0] or "application/octet-stream"

        b64_data = base64.b64encode(image_data).decode()

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

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

"""
Compute the semantic similarity between 2 sentences.
"""
@app.get("/compute_semantic_similarity")
def compute_semantic_similarity(sentence1: str, sentence2: str):
    # Encode sentences
    embeddings1 = model.encode([sentence1], convert_to_tensor=True)
    embeddings2 = model.encode([sentence2], convert_to_tensor=True)

    # Compute similarity score
    cosine_similarities = torch.nn.functional.cosine_similarity(embeddings1, embeddings2)
    similarity_score = cosine_similarities.item()

    return similarity_score