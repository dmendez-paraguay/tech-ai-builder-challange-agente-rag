import os
import shutil
from pathlib import Path
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.rag_agent import RAGAgent

app = FastAPI(
    title="Alura Agente - RAG API",
    description="Agente de IA que responde preguntas basado en un documento PDF interno.",
    version="1.0.0",
)

agent: RAGAgent | None = None
current_pdf_path: str | None = None
DATA_DIR = Path(os.getenv("DATA_DIR", "/data"))
CHROMA_DIR = DATA_DIR / "chroma_db"


class Question(BaseModel):
    question: str


class Answer(BaseModel):
    answer: str
    sources: List[str] = []


class DocumentUploadResponse(BaseModel):
    filename: str
    path: str
    agent_ready: bool


def initialize_agent(pdf_path: str, rebuild_index: bool = False):
    global agent, current_pdf_path

    if rebuild_index:
        agent = None
        current_pdf_path = None
        if CHROMA_DIR.exists():
            shutil.rmtree(CHROMA_DIR)

    new_agent = RAGAgent(pdf_path=pdf_path, persist_directory=str(CHROMA_DIR))
    new_agent.load_and_index()

    agent = new_agent
    current_pdf_path = pdf_path


@app.on_event("startup")
def startup_event():
    """
    If a configured PDF exists, index it. Otherwise, start the API and wait
    for a document upload through POST /documents/upload.
    """
    pdf_path = os.getenv("PDF_PATH", "/data/documento.pdf")

    if not os.path.exists(pdf_path):
        return

    initialize_agent(pdf_path=pdf_path)


@app.get(
    "/health",
    summary="Estado del servicio",
    description="Indica si la API esta activa y si el agente ya tiene un PDF indexado.",
)
def health():
    return {
        "status": "ok",
        "agent_ready": agent is not None,
        "pdf_path": current_pdf_path,
    }


@app.post(
    "/documents/upload",
    response_model=DocumentUploadResponse,
    summary="Subir PDF",
    description="Carga un PDF, reemplaza el indice anterior y lo deja listo para preguntas.",
)
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="El archivo debe tener nombre.")

    filename = Path(file.filename).name
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF.")

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    destination = DATA_DIR / filename

    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()

    initialize_agent(pdf_path=str(destination), rebuild_index=True)

    return DocumentUploadResponse(
        filename=filename,
        path=str(destination),
        agent_ready=agent is not None,
    )


@app.post(
    "/ask",
    response_model=Answer,
    summary="Preguntar al documento",
    description="Responde una pregunta usando el PDF indexado como contexto.",
)
def ask(payload: Question):
    if agent is None:
        raise HTTPException(status_code=503, detail="El agente todavia no esta inicializado.")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacia.")

    result = agent.query(payload.question)
    return result
