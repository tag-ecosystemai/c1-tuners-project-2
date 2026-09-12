from retrieval.retriever import retrieve
from llm.ollama_client import generate_response


def generate_flashcards(store, course_id, topic=None, num_cards=5):
    query = topic if topic else "Important concepts from this course material"

    results = retrieve(
        store,
        query,
        top_k=5,
        course_id=course_id
    )

    chunks = results["documents"][0]
    context = "\n\n".join(chunks)

    prompt = f"""
You are an AI study flashcard generator.

Create {num_cards} useful study flashcards using ONLY the study material provided below.

Each flashcard must contain:
- question
- answer

Return ONLY valid JSON in this exact structure:

{{
    "flashcards": [
        {{
            "question": "Question here",
            "answer": "Answer here"
        }}
    ]
}}

Study material:
{context}

Topic:
{query}
"""

    flashcards = generate_response(
        prompt,
        json_mode=True
    )

    return flashcards