from retrieval.retriever import retrieve
from llm.prompts import build_tutor_prompt
from llm.ollama_client import generate_response


def answer_question(store, question, course_id=None):
    results = retrieve(
        store,
        question,
        top_k=3,
        course_id=course_id
    )

    chunks = results["documents"][0]

    context = "\n\n".join(chunks)

    prompt = build_tutor_prompt(
        context,
        question
    )

    answer = generate_response(prompt)

    return answer