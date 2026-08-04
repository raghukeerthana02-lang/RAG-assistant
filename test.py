from reranker import rerank


chunks = [
    {
        "text": "Curse of dimensionality occurs when data becomes sparse.",
        "page": 41
    },
    {
        "text": "Euclidean distance measures distance between points.",
        "page": 17
    }
]


result = rerank(
    "What is curse of dimensionality?",
    chunks,
    1
)


print(result)