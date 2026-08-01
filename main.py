from dotenv import load_dotenv
from pathlib import Path
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from rag import RAGAssistant
from fastapi import HTTPException, UploadFile, File
import tempfile
import shutil
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(
    title="RAG Assistant API",
    description="Production-ready RAG chatbot built from scratch",
    version="1.0.0"
)
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx"
}
documents = []
rags={}
class ChatRequest(BaseModel):
    document_id: int
    question:str
class ChatResponse(BaseModel):
    answer:str
@app.get("/")
def home():
    return {
        "status": "running"
    }
@app.post("/chat",response_model=ChatResponse)
def chat(request:ChatRequest):
    if rag is None:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF first."
        )
    rag = rags.get(request.document_id)

    if rag is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    answer = rag.ask(request.question)
    return ChatResponse(answer=answer)


@app.post("/upload")
def upload_pdf(file: UploadFile=File(...)):
    global rag
    ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx"
    }

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Supported files: PDF, DOCX, PPTX"
        )
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=extension
    ) as temp:

        shutil.copyfileobj(file.file, temp)

        temp_path = temp.name

    document_id = len(documents) + 1

    rags[document_id] = RAGAssistant(temp_path)
    documents.append(
    {
        "id": document_id,
        "filename": file.filename,
        "file_type": extension[1:]
    }
)

    return {
        "message": "Document uploaded successfully!",
        "filename": file.filename,
        "document_type": extension.lstrip("."),
        "chunks": len(rag.chunks)
    }
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/documents")
def get_documents():

    return [
        {
            "id": doc["id"],
            "filename": doc["filename"],
            "file_type": doc["file_type"]
        }
        for doc in documents
    ]