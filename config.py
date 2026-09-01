import os

# Chunking
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

RETRIEVAL_K = 10
RERANK_K = 4

# Embedding Model
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# LLM
LLM_MODEL = "openai/gpt-oss-20b"
CITATION_K = 3

# Deployment / infra
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in (os.getenv("ALLOWED_ORIGINS") or "http://localhost:5174").split(",")
    if origin.strip()
]

FAISS_STORE_DIR = os.getenv("FAISS_STORE_DIR") or "faiss_store"

# Optional. Set to a redis:// URL to share rate-limit counters across
# multiple worker processes/instances. Left unset, slowapi falls back
# to in-memory (per-process) counters, which is fine for a single worker.
REDIS_URL = os.getenv("REDIS_URL") or None
