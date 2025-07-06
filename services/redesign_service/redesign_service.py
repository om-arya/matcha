from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai

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

@app.get("/find_accessibility_flaws")
def find_accessibility_flaws(mpl_file: str):
    pass

@app.get("/find_misleading_visual_flaws")
def find_misleading_visual_flaws(mpl_file: str):
    pass

@app.get("/find_misleading_contextual_flaws")
def find_misleading_contextual_flaws(mpl_file: str):
    prompt = f"""
        I will present a list of rule codes mapped to their descriptions, followed by a Matplotlib file.
        Output a list of the rule codes the Matplotlib file violates in the format "RULE_CODE1, RULE_CODE2, ...".
        If there are no violations, output NONE.

        Rule codes:
        BIASED_TITLE: A graph uses a biased or slanted title.
        MISLEADING_ANNOTATIONS: A graph emphasizes or fabricates causal relationships (e.g., law passed → drop in deaths).

        Matplotlib file:
        {mpl_file}
    """
    response = client.generate_content(prompt)
    candidate = response.candidates[0]
    return candidate.content.parts[0].text.strip()

@app.get("/insert_flaws")
def insert_flaws(mpl_file: str, flaws: list[str]):
    pass

if __name__ == "__main__":
    print(find_misleading_contextual_flaws("Hello"))
    import uvicorn
    uvicorn.run("redesign_service:app", host="127.0.0.1", port=8001, reload=True)