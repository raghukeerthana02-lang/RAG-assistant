def retrieve(index, chunks, embed_query, k=8):
    distances, indices = index.search(embed_query, k)

    retrieved_chunks = [chunks[idx] for idx in indices[0]]

    for idx, chunk in zip(indices[0], retrieved_chunks):
        print(f"\n===== Chunk {idx} =====")
        print(chunk)

    return retrieved_chunks