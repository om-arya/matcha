from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import torch

origins = ['*']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # List of origins allowed to make requests
    allow_credentials=True, # Allow cookies and authorization headers
    allow_methods=["*"],    # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],    # Allow all headers in the request
)

# Run on a local server via 'python semantic_similarity_service.py'

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

@app.get("/compute_semantic_similarity")
def compute_semantic_similarity(sentence1: str, sentence2: str):
    # Encode sentences
    embeddings1 = model.encode([sentence1], convert_to_tensor=True)
    embeddings2 = model.encode([sentence2], convert_to_tensor=True)

    # Compute similarity score
    cosine_similarities = torch.nn.functional.cosine_similarity(embeddings1, embeddings2)
    similarity_score = cosine_similarities.item()

    return similarity_score

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("semantic_similarity_service:app", host="127.0.0.1", port=8002, reload=True)