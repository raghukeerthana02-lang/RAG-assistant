def chunk_documents(documents, chunk_size, overlap):

    chunks = []

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    if chunk_size <= 0:
        raise ValueError("chunk size must be greater than 0")

    if overlap < 0:
        raise ValueError("overlap must be greater than or equal to 0")

    chunk_id = 0

    for document in documents:

        text = document["text"]

        if not text:
            continue

        page = document["page"]
        filename = document["filename"]

        page_chunks = []

        for start in range(
            0,
            len(text),
            chunk_size - overlap
        ):

            page_chunks.append(
                text[start:start + chunk_size]
            )

        if (
            len(page_chunks) > 1
            and len(page_chunks[-1]) < 0.5 * chunk_size
        ):

            last = page_chunks.pop()

            page_chunks[-1] += (
                last[overlap:]
                if overlap > 0
                else last
            )

        for chunk in page_chunks:

            chunks.append(
                {
                    "text": chunk,
                    "filename": filename,
                    "page": page,
                    "chunk_id": chunk_id
                }
            )

            chunk_id += 1

    return chunks