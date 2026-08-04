from rank_bm25 import BM25Okapi
import re
import nltk
from nltk.corpus import stopwords
import numpy as np

STOP_WORDS = set(stopwords.words("english"))
def tokenize(text):

    words = re.findall(
        r"\b\w+\b",
        text.lower()
    )

    words = [
        word
        for word in words
        if word not in STOP_WORDS
    ]

    return words


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

    scores = bm25.get_scores(
        tokenized_query
    )

    top_indices = np.argsort(scores)[::-1][:k]

    return [
        chunks[i]
        for i in top_indices
    ]