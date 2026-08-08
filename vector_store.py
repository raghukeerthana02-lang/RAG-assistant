import faiss


def build_index(embeddings):
    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)

    index.add(embeddings)

    return index


def save_index(index, path):
    faiss.write_index(index, path)


def load_index(path):
    return faiss.read_index(path)