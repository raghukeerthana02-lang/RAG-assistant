# Recursive character splitting: prefer the largest structural boundary
# available (paragraph, then line, then sentence, then word) and only
# hard-cut mid-word when a single unsplittable piece is still too long.
# This avoids severing sentences/words mid-way the way a fixed-offset
# slice would.
SEPARATORS = ["\n\n", "\n", ". ", "! ", "? ", " "]


def chunk_documents(documents, chunk_size, overlap):

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    if chunk_size <= 0:
        raise ValueError("chunk size must be greater than 0")

    if overlap < 0:
        raise ValueError("overlap must be greater than or equal to 0")

    chunks = []
    chunk_id = 0

    for document in documents:

        text = document["text"]

        if not text:
            continue

        page = document["page"]
        filename = document["filename"]

        for chunk_text in _chunk_text(text, chunk_size, overlap):

            chunks.append(
                {
                    "text": chunk_text,
                    "filename": filename,
                    "page": page,
                    "chunk_id": chunk_id
                }
            )

            chunk_id += 1

    return chunks


def _chunk_text(text, chunk_size, overlap):

    splits = _split_recursive(text, chunk_size, SEPARATORS)
    page_chunks = _merge_splits(splits, chunk_size, overlap)

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

    return page_chunks


def _split_recursive(text, chunk_size, separators):

    if not text:
        return []

    if len(text) <= chunk_size:
        return [text]

    if not separators:
        return [
            text[i:i + chunk_size]
            for i in range(0, len(text), chunk_size)
        ]

    separator, *rest = separators

    if separator not in text:
        return _split_recursive(text, chunk_size, rest)

    raw_pieces = text.split(separator)

    # keep the separator attached to each piece so re-joining the
    # pieces reproduces the original text exactly
    pieces = [
        piece + separator if i < len(raw_pieces) - 1 else piece
        for i, piece in enumerate(raw_pieces)
    ]

    pieces = [piece for piece in pieces if piece]

    result = []

    for piece in pieces:

        if len(piece) > chunk_size:
            result.extend(_split_recursive(piece, chunk_size, rest))
        else:
            result.append(piece)

    return result


def _merge_splits(splits, chunk_size, overlap):

    chunks = []
    current = ""

    for split in splits:

        if len(current) + len(split) <= chunk_size:
            current += split
            continue

        if current:
            chunks.append(current)

        tail = current[-overlap:] if overlap > 0 else ""
        current = tail + split

    if current:
        chunks.append(current)

    return chunks
