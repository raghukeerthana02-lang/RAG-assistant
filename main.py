from dotenv import load_dotenv
from pathlib import Path
load_dotenv()
from auth import verify_token
from fastapi import Depends
from supabase_client import supabase
from fastapi import FastAPI
from pydantic import BaseModel
from rag_manager import rag_manager
from fastapi import HTTPException, UploadFile, File

import os
import tempfile
import shutil
import uuid

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
class Source(BaseModel):
    filename: str
    page: int
class ChatRequest(BaseModel):
    document_id: str
    question:str
class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
@app.get("/")
def home():
    return {
        "status": "running"
    }
def _require_valid_document_id(document_id: str):
    try:
        uuid.UUID(document_id)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )


@app.post("/chat",response_model=ChatResponse)
def chat(
    request: ChatRequest,
    user_id: str = Depends(verify_token)
):

    _require_valid_document_id(request.document_id)

    doc = (
        supabase
        .table("documents")
        .select("*")
        .eq("id", request.document_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not doc.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    rag = rag_manager.load_document(
        request.document_id,
        user_id
    )

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


    try:

        # create database record first so we have a document_id
        # to namespace the storage path and FAISS store with

        response = (
            supabase
            .table("documents")
            .insert(
                {
                    "user_id": user_id,
                    "filename": file.filename,
                    "file_type": extension[1:],
                    "storage_path": ""
                }
            )
            .execute()
        )

        document_id = response.data[0]["id"]


        # upload original file to Supabase Storage, namespaced by document_id

        storage_path = f"{user_id}/{document_id}/{file.filename}"

        upload_document(
            temp_path,
            storage_path
        )

        (
            supabase
            .table("documents")
            .update({"storage_path": storage_path})
            .eq("id", document_id)
            .execute()
        )


        # build RAG and persist it to the FAISS store

        rag = rag_manager.load_document(
            document_id,
            user_id,
            path=temp_path,
            filename=file.filename
        )

    finally:
        os.remove(temp_path)


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

    return response.data

@app.get("/documents/{document_id}/file")
def get_document_file(
    document_id: str,
    user_id: str = Depends(verify_token)
):

    _require_valid_document_id(document_id)

    response = (
        supabase
        .table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .execute()
    )


    if not response.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )


    document = response.data[0]


    signed_url = (
        supabase
        .storage
        .from_("documents")
        .create_signed_url(
            document["storage_path"],
            60
        )
    )


    return {
        "url": signed_url["signedURL"]
    }