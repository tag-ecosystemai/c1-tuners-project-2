from agent.router import detect_course
from agent.memory import resolve_followup
from agent.intent import detect_intent
from features.tutor import answer_question
from features.quiz import generate_quiz
from features.flashcards import generate_flashcards
from retrieval.retriever import retrieve
from llm.ollama_client import generate_response


def study_agent_ask(store, question, courses, history=None):
    if history is None:
        history = []

    intent = detect_intent(question)
    context_aware_question = resolve_followup(question, history)
    course_id = detect_course(context_aware_question, courses)

    if course_id:
        course_id = course_id.lower()

    if course_id is None:
        answer = (
            "I couldn't tell which course this question relates to. "
            "Could you let me know which course you mean?"
        )
        history.append({"role": "student", "content": question})
        history.append({"role": "agent", "content": answer})
        return answer, history

    if intent == "quiz":
        answer = generate_quiz(store, course_id=course_id, num_questions=5)
    elif intent == "flashcards":
        answer = generate_flashcards(store, course_id=course_id, num_cards=5)
    elif intent == "study_guide":
        answer = generate_study_guide(store, course_id=course_id)
    else:
        answer = answer_question(
            store,
            context_aware_question,
            course_id=course_id
        )

    history.append({"role": "student", "content": question})
    history.append({"role": "agent", "content": str(answer)})

    return answer, history


def generate_study_guide(store, course_id, top_k=15):
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