from ingestion.loaders import load_pdf
from ingestion.chunker import chunk_text
from embeddings.embedder import embed_text


text = load_pdf("data/sample/thermodynamics.pdf")

chunks = chunk_text(text)

print("Number of chunks:", len(chunks))
print("First chunk length:", len(chunks[0]))
print("First chunk:")
print(chunks[0])

embedding = embed_text(chunks[0])

print("Embedding length:", len(embedding))