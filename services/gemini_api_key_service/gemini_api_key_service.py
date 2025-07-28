from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
import os
from mangum import Mangum

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Custom function to get client IP that works with both local and Lambda
def get_client_ip(request: Request):
    forwarded_for = request.headers.get("x-forwarded-for") # Try to get from X-Forwarded-For header first (API Gateway)
    if forwarded_for:
        return forwarded_for.split(",")[0].strip() # X-Forwarded-For can contain multiple IPs, take the first one
    
    # Fallback to client.host (for local development)
    if hasattr(request, 'client') and request.client:
        return request.client.host
    
    # Final fallback
    return "127.0.0.1"

limiter = Limiter(key_func=get_client_ip, default_limits=["1/minute"])

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

# Configure Mangum with explicit API Gateway v2.0 support
handler = Mangum(app, lifespan="off", api_gateway_base_path="/")

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please wait and try again."},
    )

@app.get("/get_gemini_api_key")
@limiter.limit("1/minute")
def get_gemini_api_key(request: Request):
    if not GEMINI_API_KEY:
        return JSONResponse(
            status_code=500,
            content={"error": "GEMINI_API_KEY environment variable not set"}
        )
    
    return {"gemini_api_key": GEMINI_API_KEY}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("gemini_api_key_service:app", host="127.0.0.1", port=8000, reload=True)