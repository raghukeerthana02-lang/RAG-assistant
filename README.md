# RAG Assistant Roadmap

## Project Goal

Build a production-quality Retrieval-Augmented Generation (RAG) assistant from scratch while understanding every component instead of relying on frameworks.

The goal is to learn retrieval systems, backend engineering, deployment, and production RAG architecture.

---

# Current Stack

Frontend
- React
- TypeScript
- TailwindCSS
- Vite

Backend
- FastAPI
- Python

LLM
- Groq
- Llama-3.3-70B-Versatile

Embeddings
- sentence-transformers/all-MiniLM-L6-v2

Vector Database
- FAISS

Supported Files
- PDF
- PPTX
- DOCX

---

# Completed ✅

## Backend

### Document Upload

- Upload endpoint
- Supports PDF
- Supports PPTX
- Supports DOCX
- Extract text from each format

---

### Chunking

Implemented custom chunking

Features

- Configurable chunk size
- Configurable overlap
- Validation
- Merge tiny last chunk

---

### Embeddings

SentenceTransformer

```
all-MiniLM-L6-v2
```

Each chunk is embedded.

---

### Vector Search

Implemented

```
FAISS IndexFlatL2
```

Pipeline

```
Query

↓

Embedding

↓

FAISS

↓

Top K chunks
```

---

### Prompt Builder

Custom prompt restricting model to answer ONLY from retrieved context.

---

### LLM

Groq API

Model

```
llama-3.3-70b-versatile
```

---

### RAG Pipeline

Current pipeline

```
Upload

↓

Extract text

↓

Chunk

↓

Embedding

↓

FAISS

↓

Retrieve Top-K

↓

Prompt Builder

↓

Groq

↓

Answer
```

---

### FastAPI

Implemented endpoints

- Upload document
- Ask question
- List uploaded documents

---

# Frontend

Dark ChatGPT-inspired interface.

Completed

### Chat Window

- User messages
- Assistant messages
- Thinking animation
- Welcome message
- Auto-scroll
- Enter to send
- Multiline input

---

### Sidebar

Implemented

- New Chat
- Rename Chat
- Delete Chat
- Change Source
- Search chats
- Responsive collapse
- LocalStorage persistence

---

### Right Sidebar

Implemented

- Uploaded documents
- File selection
- Highlight selected file

---

### Chat Management

Implemented

- Multiple chats
- Chat history
- Chat titles
- Search
- Local persistence
- Filter chats by document
- "All Chats" view

---

### Document Management

Implemented

- Upload multiple files
- Multiple formats
- Filter conversations by file
- Change conversation source

---

### UX

Implemented

- Typing indicator
- Loading animation
- Responsive sidebars
- Persistent conversations
- Dark theme

---

# Current Architecture

```
React

↓

FastAPI

↓

Document Loader

↓

Chunker

↓

Embeddings

↓

FAISS

↓

Top K

↓

Groq

↓

Answer

↓

React
```

---

# Remaining Roadmap

## Phase 1

### Metadata

Store metadata for every chunk

```
{
    text,
    filename,
    page,
    chunk_id
}
```

Purpose

- citations
- future reranking
- document references

---

### Citations

Return

```
Answer

Sources

filename

page / slide
```

Frontend displays clickable sources.

---

## Phase 2

### BM25

Implement lexical retrieval.

Pipeline

```
Query

↓

BM25

↓

Results
```

---

### Hybrid Retrieval

```
Query

↓

Embedding

↓

FAISS

+

BM25

↓

Merge

↓

Top Candidates
```

---

### Reranking

Pipeline

```
Top 20

↓

Cross Encoder

↓

Best 4

↓

LLM
```

Possible models

- bge-reranker
- ms-marco MiniLM reranker

---

## Phase 3

### Response Cache

Avoid repeated LLM calls.

Possible

- in-memory
- Redis (future)

---

### Logging

Store

- question
- retrieved chunks
- latency
- token usage

---

### Error Handling

Graceful handling for

- upload failures
- unsupported files
- Groq errors
- rate limits

---

### Guardrails

Reject

- empty documents
- unsupported formats
- invalid prompts

---

## Phase 4

### Docker

Dockerize

Frontend

Backend

Single

```
docker compose up
```

---

### Deployment

Deploy

Frontend

- Vercel

Backend

- Render
or
- Railway

---

### Environment Variables

Move

- API Keys
- Config

into

```
.env
```

---

## Stretch Goals

If time permits

- Streaming responses
- Semantic caching
- Query rewriting
- Multi-query retrieval
- Parent-child chunking
- Query expansion
- Image extraction from PDFs
- OCR support
- Table extraction
- User authentication
- PostgreSQL
- Conversation database
- Redis cache
- Observability dashboard

---

# Final Production Pipeline

```
Upload

↓

Extract Text

↓

Chunk

↓

Metadata

↓

Embeddings

↓

FAISS

+

BM25

↓

Merge

↓

Reranker

↓

Best Chunks

↓

Prompt Builder

↓

Groq

↓

Answer + Citations

↓

Cache

↓

Frontend
```

---

# Learning Goals

By the end of this project, understand

- Chunking strategies
- Embeddings
- Vector search
- BM25
- Hybrid retrieval
- Reranking
- Prompt engineering
- FastAPI
- React integration
- Docker
- Deployment
- Production RAG architecture

without relying on LangChain or LlamaIndex abstractions.
