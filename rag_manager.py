import os

from rag import RAGAssistant

FAISS_STORE_DIR = "faiss_store"


class RAGManager:

    def __init__(self):
        self.active_rags = {}

    def _store_dir(self, user_id, document_id):
        return os.path.join(
            FAISS_STORE_DIR,
            str(user_id),
            str(document_id)
        )

    def load_document(
        self,
        document_id,
        user_id,
        path=None,
        filename=None
    ):

        key = f"{user_id}_{document_id}"

        if key in self.active_rags:
            return self.active_rags[key]

        store_dir = self._store_dir(user_id, document_id)
        index_path = os.path.join(store_dir, "index.faiss")

        if os.path.exists(index_path):
            rag = RAGAssistant.from_store(store_dir)

        elif path:
            rag = RAGAssistant(path, filename=filename)
            rag.save(store_dir)

        else:
            return None

        self.active_rags[key] = rag

        return rag


rag_manager = RAGManager()
