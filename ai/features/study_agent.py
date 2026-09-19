from agent.router import detect_course
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
    
    # Course routing (question is already resolved to standalone)
    course_id = detect_course(question, courses)

    if course_id is None:
        answer = (
            "I couldn't tell which course this question relates to. "
            "Could you please specify the course name or code?"
        )
        return answer, history

    if intent == "quiz":
        answer = generate_quiz(store, course_id=course_id, num_questions=5)
    elif intent == "flashcards":
        answer = generate_flashcards(store, course_id=course_id, num_cards=5)
    elif intent == "study_guide":
        answer = generate_study_guide(store, course_id=course_id)
    else:
        # Pass conversation history into the updated answer_question function
        answer = answer_question(
            store,
            question,
            course_id=course_id,
            chat_history=history
        )

    return answer, history


def generate_study_guide(store, course_id, top_k=15):
    results = retrieve(
        store,
        "overview of the main topics and key concepts covered in this course",
        top_k=top_k,
        course_id=course_id
    )

    chunks = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    context = "\n\n".join(chunks)

    prompt = f"""You are an academic study guide generator. Use ONLY the course material
below to create a structured study guide. Do not invent information.

Course material:
{context}

Format:
- Numbered main topics
- Key subtopics with short bullet explanations
- Recommended study order at the end

Use blank lines between sections."""

    guide = generate_response(prompt).strip()

    sources = list({m.get("document_name") for m in metadatas if m.get("document_name")})
    if sources:
        guide += "\n\nSource: " + ", ".join(sources)

    return guide