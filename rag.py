from document_loader import extract_text
from chunker import chunk_documents
from embedding import embed_chunks, embed_query
from vector_store import build_index
from retriever import retrieve
from prompt_builder import build_prompt
from llm import generate_answer
from config import (
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    TOP_K
)
from bm25_store import (
    build_bm25,
    search_bm25
)


class RAGAssistant:

    def __init__(
        self,
        pdf_path,
        chunk_size=CHUNK_SIZE,
        overlap=CHUNK_OVERLAP,
    ):

        pages = extract_text(pdf_path)

        self.chunks = chunk_documents(
            pages,
            chunk_size,
            overlap
        )

        chunk_texts = [
            chunk["text"]
            for chunk in self.chunks
        ]

        embeddings = embed_chunks(chunk_texts)

        self.index = build_index(embeddings)
        self.bm25 = build_bm25(self.chunks)

    def ask(self, query, k=TOP_K):

        query_embedding = embed_query(query)

        retrieved_chunks = retrieve(
            self.index,
            self.chunks,
            query_embedding,
            k
        )
        bm25_chunks = search_bm25(
            self.bm25,
            self.chunks,
            query,
            k
        )

        context = "\n\n".join(
            chunk["text"]
            for chunk in retrieved_chunks
        )

        prompt = build_prompt(
            context,
            query
        )

        answer = generate_answer(prompt)

        sources = []

        seen = set()
        print("\n====================")
        print("FAISS RESULTS")
        print("====================")

        for chunk in retrieved_chunks:

            print(
                f"Page {chunk['page']}"
            )

            print("\n====================")
            print("BM25 RESULTS")
            print("====================")

            for chunk in bm25_chunks:

                print(
                    f"Page {chunk['page']}"
                )

                print(chunk["text"][:120])

                print()

        for chunk in retrieved_chunks:

            key = (
                chunk["filename"],
                chunk["page"]
            )

            if key not in seen:

                seen.add(key)

                sources.append(
                    {
                        "filename": chunk["filename"],
                        "page": chunk["page"]
                    }
                )

        return {
            "answer": answer,
            "sources": sources
        }