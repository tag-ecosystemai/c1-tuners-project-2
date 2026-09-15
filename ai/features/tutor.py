from retrieval.retriever import retrieve
from llm.ollama_client import generate_response


def answer_question(store, question, course_id=None):
    results = retrieve(
        store,
        question,
        top_k=3,
        course_id=course_id
    )

    chunks = results["documents"][0]
    metadatas = results["metadatas"][0]

    context = "\n\n".join(chunks)

    prompt = f"""Answer the student's question using ONLY the context below.

Context:
{context}

Question: {question}

Rules:
- Start with a one-sentence definition.
- Then explain in plain terms, max 3 sentences.
- If the context is unclear or contradictory, say so explicitly instead of guessing.
- Do not repeat the term being defined inside its own definition.

Answer:"""

    answer = generate_response(prompt)

    sources = []

    for metadata in metadatas:
        document_name = metadata.get("document_name")

        if document_name and document_name not in sources:
            sources.append(document_name)

    if sources:
        answer += "\n\nSource: " + ", ".join(sources)

    return answer