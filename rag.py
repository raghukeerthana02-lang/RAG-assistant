from document_loader import extract_text
from chunker import chunk_documents
from embedding import embed_chunks, embed_query
from vector_store import build_index
from bm25_store import build_bm25
from prompt_builder import build_prompt
from llm import generate_answer
from reranker import rerank
from config import (
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    RETRIEVAL_K,
    RERANK_K,
    CITATION_K
)
from hybrid_retriever import hybrid_retrieve


class RAGAssistant:

    def __init__(
        self,
        pdf_path,
        filename=None,
        chunk_size=CHUNK_SIZE,
        overlap=CHUNK_OVERLAP,
    ):

        pages = extract_text(pdf_path, filename)

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

    def ask(self, query):

        query_embedding = embed_query(query)

        retrieved_chunks = hybrid_retrieve(
            self.index,
            self.bm25,
            self.chunks,
            query_embedding,
            query,
            RETRIEVAL_K
        )
        reranked_chunks = rerank(
            query,
            retrieved_chunks,
            RERANK_K
        )

        context = "\n\n".join(
            chunk["text"]
            for chunk in reranked_chunks
        )

        prompt = build_prompt(
            context,
            query
        )

        answer = generate_answer(prompt)

        sources = []

        seen = set()

        for chunk in reranked_chunks:

            if len(sources) >= CITATION_K:
                break

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