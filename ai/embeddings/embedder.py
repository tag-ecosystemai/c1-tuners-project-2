import requests


def embed_text(text):
    response = requests.post(
        "http://localhost:11434/api/embed",
        json={
            "model": "nomic-embed-text",
            "input": text
        }
    )

    response.raise_for_status()

    result = response.json()

    if not result.get("embeddings"):
        raise ValueError(f"Ollama returned no embeddings: {result}")

    return result["embeddings"][0]


def embed_chunks(chunks):
    return [embed_text(chunk) for chunk in chunks]