from ai.retrieval.retriever import retrieve
from ai.llm.ollama_client import generate_response


def generate_topic_study_guide(store, course_id, topic=None):
    """
    Generate a study guide from the course material.
    If a topic is provided, focus the guide on that topic.
    """

    query = topic if topic else (
        "overview of the main topics and key concepts covered in this course"
    )

    results = retrieve(
        store,
        query,
        top_k=15,
        course_id=course_id
    )

    chunks = results["documents"][0]
    context = "\n\n".join(chunks)

    prompt = f"""
You are an AI study guide generator.

Create a clear and useful study guide using ONLY the study material provided below.

Topic:
{query}

Study material:
{context}

Create the study guide with:

1. Main concepts
2. Key points under each concept
3. Important definitions
4. Important relationships or principles
5. A recommended study order

If a specific topic was provided, focus the study guide on that topic.

Do not add information that is not supported by the study material.

Format the answer clearly using headings, numbered sections, and bullet points.
"""

    guide = generate_response(prompt)

    return guide