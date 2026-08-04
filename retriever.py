def retrieve(index, chunks, embed_query, k=8):
    distances, indices = index.search(embed_query, k)

    retrieved_chunks = [chunks[idx] for idx in indices[0]]

    for chunk in retrieved_chunks:

        print(
            f"\n===== Chunk {chunk['chunk_id']} "
            f"(Page {chunk['page']}) ====="
        )

        print(chunk["text"])

    return retrieved_chunks