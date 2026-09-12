import uuid

from ingestion.loaders import load_pdf
from ingestion.chunker import chunk_text
from embeddings.embedder import embed_chunks
from retrieval.vector_store import VectorStore


def ingest_document(
    file_path,
    course_id,
    document_id,
    document_name
):
    text = load_pdf(file_path)

    chunks = chunk_text(text)

    embeddings = embed_chunks(chunks)

    ids = [
        str(uuid.uuid4())
        for _ in chunks
    ]

    metadatas = [
        {
            "course_id": course_id,
            "document_id": document_id,
            "document_name": document_name
        }
        for _ in chunks
    ]

    store = VectorStore()

    store.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return store