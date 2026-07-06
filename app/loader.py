"""
Carga el PDF y lo divide en fragmentos (chunks) manejables para
generar embeddings. Un chunk_size más chico da respuestas más
precisas pero puede perder contexto; probá valores entre 500 y 1500
según qué tan denso sea tu documento.
"""

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter


def load_and_split_pdf(pdf_path: str, chunk_size: int = 1000, chunk_overlap: int = 150):
    loader = PyPDFLoader(pdf_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )

    return splitter.split_documents(documents)
