from agent.router import detect_course
from agent.memory import resolve_followup
from features.tutor import answer_question
from llm.ollama_client import generate_response
from retrieval.retriever import retrieve

def study_agent_ask(store, question, courses, history=None):
    """
    Entry point for the Study Agent - the single place a student talks to,
    instead of opening a specific course's Tutor.

    store: the VectorStore instance
    question: the student's message
    courses: list of {"course_id": ..., "name": ...} available to this student
    history: list of past {"role": ..., "content": ...} turns, or None to start fresh

    Returns (answer, updated_history) so the caller can keep the conversation going.
    """

    if history is None:
        history = []

    standalone_question = resolve_followup(question, history)

    course_id = detect_course(standalone_question, courses)

    if course_id is None:
        answer = (
            "I couldn't tell which course this question relates to. "
            "Could you let me know which course you mean?"
        )
    else:
        answer = answer_question(
            store,
            standalone_question,
            course_id=course_id
        )

    history.append({"role": "student", "content": question})
    history.append({"role": "agent", "content": answer})

    return answer, history

def generate_study_guide(store, course_id, top_k=15):
    """
    Generates a structured study guide for a course, grounded in the
    student's actual uploaded materials rather than general knowledge.

    store: the VectorStore instance
    course_id: which course to generate the guide for
    top_k: how many chunks to pull for a broad view of the material
    """

    results = retrieve(
        store,
        "overview of the main topics and key concepts covered in this course",
        top_k=top_k,
        course_id=course_id
    )

    chunks = results["documents"][0]
    context = "\n\n".join(chunks)

    prompt = f"""You are a study guide generator. Use ONLY the course material
below to create a structured study guide. Do not add information that is
not present in the material.

Course material:
{context}

Create a study guide with:
- Numbered main topics
- Key subtopics under each one
- A recommended study order at the end

Format it clearly using plain text with numbers and dashes."""

    guide = generate_response(prompt)

    return guide