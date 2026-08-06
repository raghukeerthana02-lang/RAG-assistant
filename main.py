from dotenv import load_dotenv
from pathlib import Path
load_dotenv()
from auth import verify_token
from fastapi import Depends
from supabase_client import supabase
from fastapi import FastAPI
from pydantic import BaseModel
from rag import RAGAssistant
from fastapi import HTTPException, UploadFile, File
from fastapi.responses import FileResponse
import tempfile
import shutil
import mimetypes
import time
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from storage import upload_document
security = HTTPBearer()
app=FastAPI(
    title="RAG Assistant API",
    description="Production-ready RAG chatbot built from scratch",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx"
}
documents = []
rags={}
class Source(BaseModel):
    filename: str
    page: int
class ChatRequest(BaseModel):
    document_id: int
    question:str
class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
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

    response = rag.ask(request.question)

    return ChatResponse(
        answer=response["answer"],
        sources=response["sources"]
    )


@app.post("/upload")
def upload_pdf(
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token)
):

    extension = Path(file.filename).suffix.lower()


    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Supported files: PDF, DOCX, PPTX"
        )


    # check duplicate filename
    existing = (
        supabase
        .table("documents")
        .select("id")
        .eq("user_id", user_id)
        .eq("filename", file.filename)
        .execute()
    )


    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="File already exists"
        )


    # temporary file for RAG processing
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=extension
    ) as temp:

        shutil.copyfileobj(
            file.file,
            temp
        )

        temp_path=temp.name



    # build RAG
    rag = RAGAssistant(
        temp_path,
        filename=file.filename
    )


    # upload original file to Supabase Storage

    storage_path = f"{user_id}/{file.filename}"


    upload_document(
        temp_path,
        storage_path
    )



    # save database record

    response = (
        supabase
        .table("documents")
        .insert(
            {
                "user_id": user_id,
                "filename": file.filename,
                "file_type": extension[1:],
                "storage_path": storage_path
            }
        )
        .execute()
    )


    document_id = response.data[0]["id"]


    # temporary until FAISS migration
    rags[document_id] = rag



    return {
        "message":"Document uploaded successfully",
        "document_id":document_id,
        "filename":file.filename,
        "chunks":len(rag.chunks)
    }
@app.get("/documents")
def get_documents(
    user_id:str = Depends(verify_token)
):

    response = (
        supabase
        .table("documents")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )
    print(response.data)
    print("CURRENT USER:", user_id)

    return response.data