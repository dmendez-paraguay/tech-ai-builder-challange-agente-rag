import os
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from app.rag_agent import RAGAgent

app = FastAPI(
    title="Alura Agente - RAG API",
    description="Agente de IA que responde preguntas basado en un documento PDF interno.",
    version="1.0.0",
)

agent: RAGAgent | None = None


class Question(BaseModel):
    question: str


class Answer(BaseModel):
    answer: str
    sources: List[str] = []


@app.on_event("startup")
def startup_event():
    """
    Se ejecuta una sola vez al levantar el contenedor: indexa el PDF
    (o reutiliza el índice ya persistido) y deja el agente listo.
    """
    global agent
    pdf_path = os.getenv("PDF_PATH", "/data/documento.pdf")

    if not os.path.exists(pdf_path):
        raise RuntimeError(
            f"No se encontró el PDF en {pdf_path}. "
            f"Verificá que el archivo esté en ./data y que PDF_PATH sea correcto en .env"
        )

    agent = RAGAgent(pdf_path=pdf_path)
    agent.load_and_index()


@app.get("/health")
def health():
    return {"status": "ok", "agent_ready": agent is not None}


@app.post("/ask", response_model=Answer)
def ask(payload: Question):
    if agent is None:
        raise HTTPException(status_code=503, detail="El agente todavía no está inicializado.")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="La pregunta no puede estar vacía.")

    result = agent.query(payload.question)
    return result
