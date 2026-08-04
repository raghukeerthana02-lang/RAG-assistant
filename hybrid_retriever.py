from retriever import retrieve
from bm25_store import search_bm25


def hybrid_retrieve(
    faiss_index,
    bm25_index,
    chunks,
    query_embedding,
    query,
    k=8
):

    faiss_results = retrieve(
        faiss_index,
        chunks,
        query_embedding,
        k
    )

    bm25_results = search_bm25(
        bm25_index,
        chunks,
        query,
        k
    )

    merged = []

    seen = set()

    for chunk in faiss_results + bm25_results:

        if chunk["chunk_id"] not in seen:

            seen.add(chunk["chunk_id"])

            merged.append(chunk)

    return merged