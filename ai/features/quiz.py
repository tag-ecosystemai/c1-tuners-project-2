from retrieval.retriever import retrieve
from llm.ollama_client import generate_response


def generate_quiz(store, course_id, topic=None, num_questions=5):
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
You are an AI study quiz generator.

Create {num_questions} multiple-choice questions using ONLY the study material provided below.

Each question must have:
- question
- options: exactly 4 options
- answer: the correct option
- explanation: a short explanation

Return ONLY valid JSON in this exact structure:

{{
    "questions": [
        {{
            "question": "Question here",
            "options": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "answer": "Option A",
            "explanation": "Explanation here"
        }}
    ]
}}

Study material:
{context}

Topic:
{query}
"""

    quiz = generate_response(
        prompt,
        json_mode=True
    )

    return quiz