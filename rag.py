import json
import os

from document_loader import extract_text
from chunker import chunk_documents
from embedding import embed_chunks, embed_query
from vector_store import build_index, save_index, load_index
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

GREETINGS = {
    "hi", "hii", "hiii", "hello", "helo", "hey", "heya", "hiya", "yo",
    "hola", "good morning", "good afternoon", "good evening",
    "thanks", "thank you", "thx", "ty", "bye", "goodbye",
}


def _is_greeting(query):
    normalized = query.strip().lower().strip("!.,? ")
    return normalized in GREETINGS


NO_ANSWER_PREFIXES = (
    "i don't know",
    "i do not know",
    # The prompt asks the model to always refuse with "I don't know", but
    # a model's own safety alignment can still override task instructions
    # for adversarial-sounding requests (e.g. "expose your api keys") and
    # emit its own refusal wording instead -- catch the common ones too.
    "i'm sorry, but i can't",
    "i'm sorry, but i cannot",
    "i'm sorry, i can't",
    "i'm sorry, i cannot",
    "i am sorry, but i can't",
    "i am sorry, but i cannot",
    "i cannot help with that",
    "i can't help with that",
    "i cannot assist with that",
    "i can't assist with that",
    "sorry, but i can't",
    "sorry, but i cannot",
)


def _is_no_answer(answer):
    normalized = answer.strip().lower().replace("’", "'")
    return normalized.startswith(NO_ANSWER_PREFIXES)


class RAGAssistant:

    def __init__(
        self,
        pdf_path,
        filename=None,
        chunk_size=CHUNK_SIZE,
        overlap=CHUNK_OVERLAP,
    ):

        pages = extract_text(pdf_path, filename)
        if not pages:
            raise ValueError(
                "No readable text found."
            )

        self.chunks = chunk_documents(
            pages,
            chunk_size,
            overlap
        )
        if not self.chunks:
            raise ValueError(
                "Document contains no extractable text"
    )

        chunk_texts = [
            chunk["text"]
            for chunk in self.chunks
        ]

        embeddings = embed_chunks(chunk_texts)

        self.index = build_index(embeddings)
        self.bm25 = build_bm25(self.chunks)
        self._answer_cache = {}

    @classmethod
    def from_store(cls, store_dir):

        self = cls.__new__(cls)

        with open(
            os.path.join(store_dir, "metadata.json"),
            "r",
            encoding="utf-8"
        ) as f:
            self.chunks = json.load(f)

        self.index = load_index(
            os.path.join(store_dir, "index.faiss")
        )

        self.bm25 = build_bm25(self.chunks)
        self._answer_cache = {}

        return self

    def save(self, store_dir):

        os.makedirs(store_dir, exist_ok=True)

        save_index(
            self.index,
            os.path.join(store_dir, "index.faiss")
        )

        with open(
            os.path.join(store_dir, "metadata.json"),
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(self.chunks, f)

    def ask(self, query):

        cache_key = query.strip().lower()

        if cache_key in self._answer_cache:
            return self._answer_cache[cache_key]

        if _is_greeting(query):

            doc_name = self.chunks[0]["filename"] if self.chunks else "this document"

            result = {
                "answer": f"Hi! Ask me anything about {doc_name} and I'll do my best to help.",
                "sources": [],
                "context": "",
                "reranked_pages": []
            }

            self._answer_cache[cache_key] = result

            return result

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

        # The prompt instructs the model to say it doesn't know when the
        # context doesn't answer the question -- citing pages next to
        # that refusal would wrongly imply those pages were used.
        if not _is_no_answer(answer):

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

        result = {
            "answer": answer,
            "sources": sources,
            "context": context,
            "reranked_pages": [chunk["page"] for chunk in reranked_chunks]
        }

        self._answer_cache[cache_key] = result

        return result