import sys
import faiss
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')
from sentence_transformers import SentenceTransformer
model=SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
sentences=[
    "Python is a programming language.",

    "Python is used for machine learning.",

    "I enjoy eating pizza.",

    "Dogs are loyal animals.",

    "Cats are playful pets.",

    "FastAPI is a Python web framework.",

    "The Eiffel Tower is in Paris."
]
chunks=[
    'Kittens are so cute.',
    'I love bottles.',
    'I hate fuzzy sweaters.'
]
embeddings=model.encode(chunks)
print(embeddings.shape)
query='Tell me about a fuzzy animal'
embedquery=model.encode(query)
index=faiss.IndexFlatL2(384)
index.add(embeddings)
embedquery=embedquery.reshape(1,-1)
distances, indices=index.search(embedquery,2)
print(distances)
print(indices)
