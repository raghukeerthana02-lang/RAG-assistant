from rank_bm25 import BM25Okapi
import re
import nltk
import numpy as np


def tokenize(text):

    return re.findall(
        r"\b\w+\b",
        text.lower()
    )


def build_bm25(chunks):

    tokenized_chunks = [
    tokenize(chunk["text"])
    for chunk in chunks
]

    bm25 = BM25Okapi(tokenized_chunks)

    return bm25


def search_bm25(
    bm25,
    chunks,
    query,
    k=8
):

    tokenized_query = tokenize(query)
    print("\nQuery Tokens:")
    print(tokenized_query)

    scores = bm25.get_scores(
        tokenized_query
    )

    ranked_indices = sorted(
        range(len(scores)),
        key=lambda i: scores[i],
        reverse=True
    )

    top_indices = np.argsort(scores)[::-1][:k]
    for i in top_indices:

        print(f"Score: {scores[i]:.3f}")

        print(chunks[i]["text"][:120])

        print()

    return [
        chunks[i]
        for i in top_indices
    ]