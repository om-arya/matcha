from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

# Run on a local server via 'uvicorn summary_service:app --reload'
# Then, go to the URL Uvicorn indicates its running on; mine is http://127.0.0.1:8000

"""
Returns a Gemini API key.
"""
@app.get("/get_gemini_api_key")
def get_gemini_api_key():
    return GEMINI_API_KEY