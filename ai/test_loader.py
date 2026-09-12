from ingestion.loaders import load_pdf
from ingestion.chunker import chunk_text


pdf_path = "data/sample/The 7 Habits of Highly Effective People.pdf"

text = load_pdf(pdf_path)

chunks = chunk_text(text)

print("Characters extracted:", len(text))
print("Number of chunks:", len(chunks))

print("\n--- CHUNK 1 ---")
print(chunks[0])

print("\n--- CHUNK 2 ---")
print(chunks[1])