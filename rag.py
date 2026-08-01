from pdf_loader import load_pdf
from chunker import chunk_text
from embedding import embed_chunks, embed_query
from vector_store import build_index
from retriever import retrieve
from prompt_builder import build_prompt
from llm import generate_answer


class RAGAssistant:

    def __init__(
        self,
        pdf_path,
        chunk_size=500,
        overlap=50,
    ):

        text = load_pdf(pdf_path)

        self.chunks = chunk_text(
            text,
            chunk_size,
            overlap
        )

        embeddings = embed_chunks(self.chunks)

        self.index = build_index(embeddings)

    def ask(self, query, k=8):

        query_embedding = embed_query(query)

        retrieved_chunks = retrieve(
            self.index,
            self.chunks,
            query_embedding,
            k
        )

        context = "\n\n".join(retrieved_chunks)

        prompt = build_prompt(
            context,
            query
        )

        answer = generate_answer(prompt)

        return answer