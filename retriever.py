def retrieve(index, chunks, embed_query, k=8):
    distances, indices = index.search(embed_query, k)

    retrieved_chunks = [chunks[idx] for idx in indices[0]]

    return retrieved_chunks