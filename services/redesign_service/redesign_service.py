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

def generate_response(prompt: str):
    result = client.generate_content(prompt)
    candidate = result.candidates[0]
    return candidate.content.parts[0].text.strip()

@app.get("/find_flaws")
def find_flaws(mpl_file: str):
    # Insert code from GS

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
    response = generate_response(prompt)
    return response

@app.get("/find_and_fix_flaws")
def find_and_fix_flaws(mpl_file: str):
    flaws = find_flaws(mpl_file)

    prompt = f"""
        I will present a list of flaws, followed by a Matplotlib file containing those flaws.
        Output the Matplotlib file with the flaws removed.

        Flaws: {flaws}

        Matplotlib file:
        {mpl_file}
    """

    response = generate_response(prompt)
    return response

@app.get("/insert_flaws")
def insert_flaws(mpl_file: str, flaws: list[str]):
    existing_flaws = find_flaws(mpl_file)
    new_flaws = []
    for flaw in flaws:
        if flaw not in existing_flaws:
            new_flaws.append(flaw)

    prompt = f"""
        I will present a list of flaws, followed by a Matpotlib file.
        Output the Matplotlib file with the flaws inserted into it.
        
        Flaws: {new_flaws}

        Matplotlib file:
        {mpl_file}
    """

    response = generate_response(prompt)
    return response

if __name__ == "__main__":
    print(find_and_fix_flaws("Hello"))
    import uvicorn
    uvicorn.run("redesign_service:app", host="127.0.0.1", port=8001, reload=True)