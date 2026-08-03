from dotenv import load_dotenv
from pathlib import Path
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from rag import RAGAssistant
from fastapi import HTTPException, UploadFile, File
from fastapi.responses import FileResponse
import tempfile
import shutil
import mimetypes
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

    rag = RAGAssistant(temp_path)
    rags[document_id] = rag
    documents.append(
    {
        "id": document_id,
        "filename": file.filename,
        "file_type": extension[1:],
        "path": temp_path
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
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/documents/{document_id}/file")
def get_document_file(document_id: int):
    doc = next((d for d in documents if d["id"] == document_id), None)

    if doc is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    media_type = mimetypes.guess_type(doc["filename"])[0] or "application/octet-stream"

    return FileResponse(
        doc["path"],
        media_type=media_type,
        filename=doc["filename"],
        content_disposition_type="inline"
    )

@app.get("/documents")
def get_documents():

    return [
        {
            "id": doc["id"],
            "filename": doc["filename"],
            "file_type": doc["file_type"],
            "path": doc["path"]
        }
        for doc in documents
    ]