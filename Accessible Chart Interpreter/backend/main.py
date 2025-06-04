from fastapi import FastAPI

app = FastAPI()

# Run "fastapi dev main.py" in your terminal to run this backend on your local server

@app.get("/")
async def root():
    return {"message": "Hello World"}