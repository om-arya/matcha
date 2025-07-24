from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
from mangum import Mangum

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

limiter = Limiter(key_func=get_remote_address, default_limits=["1/minute"])

app = FastAPI()
app.state.limiter = limiter

origins = ['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of origins allowed to make requests
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],    # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allow all headers in the request
)

handler = Mangum(app)

# Run on a local server via 'python gemini_api_key_service.py'

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please wait and try again."},
    )

"""
Returns a Gemini API key.
"""
@app.get("/get_gemini_api_key")
@limiter.limit("1/minute")
def get_gemini_api_key(request: Request):
    return {"gemini_api_key": GEMINI_API_KEY}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("gemini_api_key_service:app", host="127.0.0.1", port=8000, reload=True)