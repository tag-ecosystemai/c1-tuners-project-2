import uuid
import os
from ingestion.loaders import load_pdf
from ingestion.audio_loader import load_audio
from ingestion.chunker import chunk_text
from embeddings.embedder import embed_chunks
from retrieval.vector_store import VectorStore


def ingest_document(file_path, course_id, document_id, document_name):
    store = VectorStore()

    existing = store.collection.get(
        where={
            "document_id": document_id
        },
        limit=1
    )

    if existing["ids"]:
        print(f"Document '{document_id}' already exists. Skipping ingestion.")
        return store

    text = load_pdf(file_path)
    chunks = chunk_text(text)
    embeddings = embed_chunks(chunks)

    ids = [str(uuid.uuid4()) for _ in chunks]

    metadatas = [
        {
            "course_id": course_id,
            "document_id": document_id,
            "document_name": document_name,
            "source_type": "pdf"
        }
        for _ in chunks
    ]

    store.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return store




def ingest_audio(
    file_path,
    course_id,
    document_id,
    document_name
):
    store = VectorStore()

    existing = store.collection.get(
        where={
            "document_id": document_id
        },
        limit=1
    )

    if existing["ids"]:
        print(f"Document '{document_id}' already exists. Skipping ingestion.")
        return store

    text = load_audio(file_path)
    chunks = chunk_text(text)
    embeddings = embed_chunks(chunks)

    ids = [str(uuid.uuid4()) for _ in chunks]

    metadatas = [
        {
            "course_id": course_id,
            "document_id": document_id,
            "document_name": document_name,
            "source_type": "audio"
        }
        for _ in chunks
    ]

    store.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return store


def ingest_file(file_path, course_id, document_id, document_name=None):
    extension = os.path.splitext(file_path)[1].lower()

    if document_name is None:
        document_name = os.path.basename(file_path)

    if extension == ".pdf":
        return ingest_document(
            file_path=file_path,
            course_id=course_id,
            document_id=document_id,
            document_name=document_name
        )

    elif extension in {".mp3", ".wav", ".m4a", ".flac", ".ogg", ".aac"}:
        return ingest_audio(
            file_path=file_path,
            course_id=course_id,
            document_id=document_id,
            document_name=document_name
        )

    else:
        raise ValueError(f"Unsupported file type: {extension}")