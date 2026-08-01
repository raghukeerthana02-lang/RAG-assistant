from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def embed_chunks(chunks):
    return model.encode(chunks)


def embed_query(query):
    return model.encode(query).reshape(1, -1)