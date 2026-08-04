from sentence_transformers import CrossEncoder


model = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)
def rerank(
    query,
    chunks,
    k=4
):

    pairs = []

    for chunk in chunks:

        pairs.append(
            [
                query,
                chunk["text"]
            ]
        )


    scores = model.predict(pairs)


    scored_chunks = []

    for chunk, score in zip(chunks, scores):

        scored_chunks.append(
            (
                chunk,
                score
            )
        )


    scored_chunks.sort(
        key=lambda x: x[1],
        reverse=True
    )


    return [
        chunk
        for chunk, score in scored_chunks[:k]
    ]