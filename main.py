from dotenv import load_dotenv
from pathlib import Path
load_dotenv()

import os
import sentry_sdk

SENTRY_DSN = os.getenv("SENTRY_DSN")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.1,
        send_default_pii=False
    )

from auth import verify_token
from fastapi import Depends
from supabase_client import supabase
from fastapi import FastAPI
from pydantic import BaseModel
from rag_manager import rag_manager
from fastapi import HTTPException, UploadFile, File
import logging
import random
import tempfile
import shutil
import magic
import threading
import uuid
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, BackgroundTasks
from fastapi.responses import JSONResponse
from eval_logging import log_faithfulness_sample
from llm import LLMRateLimitedError
from config import ALLOWED_ORIGINS, REDIS_URL

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
    key_func=get_remote_address,
    storage_uri=REDIS_URL
)
app.state.limiter=limiter
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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

@app.middleware("http")
async def access_log(request, call_next):

    start = time.time()

    response = await call_next(request)

    duration_ms = (time.time() - start) * 1000

    logger.info(
        "%s %s -> %s (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms
    )

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

# Caps how many documents get chunked/embedded/indexed at once -- that step
# is the CPU/RAM-heavy part of an upload. A bounded wait (rather than an
# unbounded queue) means a request fails fast and cleanly instead of hanging
# if something upstream is stuck holding the slot.
UPLOAD_SEMAPHORE = threading.Semaphore(1)
UPLOAD_QUEUE_TIMEOUT_SECONDS = 60
FAITHFULNESS_SAMPLE_RATE = 0.1
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

@app.get("/health")
def health():

    checks = {}

    try:
        supabase.table("documents").select("id").limit(1).execute()
        checks["supabase"] = "ok"

    except Exception:
        logger.exception("Health check: Supabase unreachable")
        checks["supabase"] = "error"

    # Not making a live Groq call here to avoid burning API quota on
    # every health-check ping; this only confirms the key is present,
    # which the server would already have failed to start without.
    checks["groq"] = "configured" if os.getenv("GROQ_API_KEY") else "missing"

    status = "ok" if all(
        v in ("ok", "configured") for v in checks.values()
    ) else "degraded"

    return {
        "status": status,
        "checks": checks
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
    background_tasks: BackgroundTasks,
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

    except LLMRateLimitedError as e:
        logger.warning("LLM rate limited: %s", e)

        raise HTTPException(
            status_code=429,
            detail=str(e)
        )

    except Exception:
        logger.exception(
            "RAG generation failed"
        )

        raise HTTPException(
            status_code=503,
            detail="AI service unavailable"
        )

    if random.random() < FAITHFULNESS_SAMPLE_RATE:
        background_tasks.add_task(
            log_faithfulness_sample,
            chat_request.document_id,
            chat_request.question,
            response.get("context", ""),
            response["answer"]
        )

    return ChatResponse(
        answer=response["answer"],
        sources=response["sources"]
    )

@app.post("/upload")
@limiter.limit("5/minute")
def upload_pdf(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Depends(verify_token)
):

    safe_filename = os.path.basename(file.filename)

    contents = file.file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File too large. Maximum size is 10MB."
        )

    file.file.seek(0)
    extension = Path(safe_filename).suffix.lower()


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
        .eq("filename", safe_filename)
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

    document_id = None

    try:

        # create database record first so we have a document_id
        # to namespace the storage path and FAISS store with

        response = (
            supabase
            .table("documents")
            .insert(
                {
                    "user_id": user_id,
                    "filename": safe_filename,
                    "file_type": extension[1:],
                    "storage_path": ""
                }
            )
            .execute()
        )

        document_id = response.data[0]["id"]


        # upload original file to Supabase Storage, namespaced by document_id

        storage_path = f"{user_id}/{document_id}/{safe_filename}"

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


        # Building the RAG index (chunking, embedding, FAISS) is the one
        # CPU/RAM-heavy step -- cap how many run at once so concurrent
        # uploads from different users don't multiply memory pressure.
        # Bounded wait instead of an unlimited one: fail fast and clean
        # rather than leaving a request hanging if the server is busy.
        if not UPLOAD_SEMAPHORE.acquire(timeout=UPLOAD_QUEUE_TIMEOUT_SECONDS):

            supabase.table("documents").delete().eq("id", document_id).execute()

            raise HTTPException(
                status_code=503,
                detail="We're processing another upload right now. Please try again in a moment."
            )

        try:

            # build RAG and persist it to the FAISS store

            rag = rag_manager.load_document(
                document_id,
                user_id,
                path=temp_path,
                filename=safe_filename
            )

        finally:
            UPLOAD_SEMAPHORE.release()

    except ValueError:

        supabase.table("documents").delete().eq("id", document_id).execute()

        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from this file. It may be a scanned or image-only document."
        )

    except HTTPException:
        raise

    except Exception:

        logger.exception("Document processing failed")

        if document_id is not None:
            supabase.table("documents").delete().eq("id", document_id).execute()

        raise HTTPException(
            status_code=503,
            detail="Document processing failed. Please try again."
        )

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


    return {
        "message":"Document uploaded successfully",
        "document_id":document_id,
        "filename":safe_filename,
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
@limiter.limit("30/minute")
def get_document_file(
    request: Request,
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

