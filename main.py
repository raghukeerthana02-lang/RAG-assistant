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
import logging
import os
import tempfile
import shutil
import magic
import uuid
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

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
logging.basicConfig(
    level=logging.INFO
)

logger = logging.getLogger(__name__)
limiter=Limiter(
    key_func=get_remote_address
)
app.state.limiter=limiter
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.middleware("http")
async def security_headers(request, call_next):

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(
    request: Request,
    exc: RateLimitExceeded
):

    return JSONResponse(
        status_code=429,
        content={
            "detail":"Too many requests. Please try again later."
        }
    )

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".pptx"
}
ALLOWED_MIME = {
    "application/pdf",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}
MAX_FILE_SIZE = 10 * 1024 * 1024
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
@limiter.limit("20/minute")
def chat(
    request: Request,
    chat_request: ChatRequest,
    user_id: str = Depends(verify_token)
):

    _require_valid_document_id(chat_request.document_id)

    doc = (
        supabase
        .table("documents")
        .select("*")
        .eq("id", chat_request.document_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not doc.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    rag = rag_manager.load_document(
        chat_request.document_id,
        user_id
    )

    if rag is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    try:
        response = rag.ask(chat_request.question)

    except Exception:
        logger.exception(
            "RAG generation failed"
        )

        raise HTTPException(
            status_code=503,
            detail="AI service unavailable"
        )

    return ChatResponse(
        answer=response["answer"],
        sources=response["sources"]
    )

@app.post("/upload")
@limiter.limit("5/minute")
async def upload_pdf(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token)
):

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB."
        )

    file.file.seek(0)
    extension = Path(file.filename).suffix.lower()


    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Supported files: PDF, DOCX, PPTX"
        )
    mime = magic.from_buffer(
    contents,
    mime=True
)
    if mime not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type"
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
        if os.path.exists(temp_path):
            os.remove(temp_path)


    return {
        "message":"Document uploaded successfully",
        "document_id":document_id,
        "filename":file.filename,
        "chunks":len(rag.chunks)
    }
@app.get("/documents")
@limiter.limit("30/minute")
def get_documents(
    request: Request,
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

