"""
Agente RAG: indexa el PDF una sola vez (persistiendo los embeddings
en disco con Chroma) y responde preguntas basándose únicamente en
el contenido de ese documento.
"""

import os

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA

from app.loader import load_and_split_pdf
from app.llm_factory import get_llm


class RAGAgent:
    def __init__(self, pdf_path: str, persist_directory: str = "/data/chroma_db"):
        self.pdf_path = pdf_path
        self.persist_directory = persist_directory
        self.vectorstore = None
        self.qa_chain = None

    def load_and_index(self):
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        # Si ya existe un índice persistido, lo reutiliza en vez de
        # re-procesar el PDF y regenerar embeddings en cada arranque.
        if os.path.exists(self.persist_directory) and os.listdir(self.persist_directory):
            self.vectorstore = Chroma(
                persist_directory=self.persist_directory,
                embedding_function=embeddings,
            )
        else:
            chunks = load_and_split_pdf(self.pdf_path)
            self.vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=self.persist_directory,
            )
            self.vectorstore.persist()

        llm = get_llm(temperature=0)

        # "stuff" mete todos los fragmentos recuperados directo en el
        # prompt. Con k=4 fragmentos y chunks de ~1000 caracteres
        # entra cómodo en el contexto del modelo.
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 4}),
            return_source_documents=True,
        )

    def query(self, question: str) -> dict:
        if self.qa_chain is None:
            raise RuntimeError("El agente no fue inicializado. Llamá a load_and_index() primero.")

        result = self.qa_chain.invoke({"query": question})

        sources = sorted({
            f"{doc.metadata.get('source', 'desconocido')} (pág. {doc.metadata.get('page', '?')})"
            for doc in result.get("source_documents", [])
        })

        return {
            "answer": result["result"],
            "sources": sources,
        }
