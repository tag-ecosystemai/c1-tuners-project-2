from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.course import Course

from ai.retrieval.vector_store import VectorStore
from ai.features.study_agent import study_agent_ask
from ai.features.quiz import generate_quiz
from ai.features.flashcards import generate_flashcards
from ai.agent.router import detect_course

from app.services.followup_resolver import resolve_question_in_backend
from app.services.study_guide_service import generate_topic_study_guide


router = APIRouter(
    prefix="/study-agent",
    tags=["Study Agent"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


class StudyAgentRequest(BaseModel):
    question: str
    history: list[dict] = []


def extract_topic(question: str, request_type: str):
    """
    Extract the topic from quiz or flashcard requests.
    """

    question_lower = question.lower().strip()

    prefixes = {
        "quiz": [
            "give me a quiz on ",
            "create a quiz on ",
            "make a quiz on ",
            "quiz me on ",
        ],
        "flashcards": [
            "give me flashcards on ",
            "give me flashcards for ",
            "create flashcards on ",
            "create flashcards for ",
            "make flashcards on ",
            "make flashcards for ",
        ],
        "study_guide": [
            "create a study guide for ",
            "create a study guide on ",
            "make a study guide for ",
            "make a study guide on ",
            "give me a study guide for ",
            "give me a study guide on ",
        ]
    }

    for prefix in prefixes.get(request_type, []):
        if question_lower.startswith(prefix):
            return question[len(prefix):].strip()

    return None


def detect_special_request(question: str):
    """
    Detect whether the request is for a quiz,
    flashcards, or study guide.
    """

    question_lower = question.lower()

    if "quiz" in question_lower or "test me" in question_lower:
        return "quiz"

    if "flashcard" in question_lower or "flash card" in question_lower:
        return "flashcards"

    if (
        "study guide" in question_lower
        or "study plan" in question_lower
    ):
        return "study_guide"

    return None


@router.post("/")
def run_study_agent(
    request: StudyAgentRequest,
    db: Session = Depends(get_db)
):
    # Get courses from database
    courses = db.query(Course).all()

    # Convert them to the format expected by the AI course detector
    ai_courses = [
        {
            "course_id": str(course.id),
            "name": course.name
        }
        for course in courses
    ]

    # Resolve simple follow-up questions
    standalone_question = resolve_question_in_backend(
        request.question,
        request.history
    )

    # Create vector store
    store = VectorStore()

    # Check whether this is a quiz or flashcard request
    request_type = detect_special_request(
        standalone_question
    )

    # --------------------------------
    # QUIZ
    # --------------------------------
    if request_type == "quiz":

        topic = extract_topic(
            standalone_question,
            "quiz"
        )

        # Use the existing course detector
        course_id = detect_course(
            topic if topic else standalone_question,
            ai_courses
        )

        if course_id:
            answer = generate_quiz(
                store,
                course_id=course_id,
                topic=topic,
                num_questions=5
            )

        else:
            answer = (
                "I couldn't determine which course this quiz "
                "should be based on. Please mention the course."
            )

    # --------------------------------
    # FLASHCARDS
    # --------------------------------
    elif request_type == "flashcards":

        topic = extract_topic(
            standalone_question,
            "flashcards"
        )

        # Use the teammate's existing course detector
        course_id = detect_course(
            topic if topic else standalone_question,
            ai_courses
        )

        if course_id:
            answer = generate_flashcards(
                store,
                course_id=course_id,
                topic=topic,
                num_cards=5
            )

        else:
            answer = (
                "I couldn't determine which course these flashcards "
                "should be based on. Please mention the course."
            )

    elif request_type == "study_guide":
        topic = extract_topic(
            standalone_question,
            "study_guide"
        )

        course_id = detect_course(
            topic if topic else standalone_question,
            ai_courses
        )

        if course_id:
            answer = generate_topic_study_guide(
                store,
                course_id=course_id,
                topic=topic
            )

        else:
            answer = (
                "I couldn't determine which course this study guide "
                "should be based on. Please mention the course."
            )

    # --------------------------------
    # --------------------------------
    else:

        answer, _ = study_agent_ask(
            store,
            standalone_question,
            ai_courses,
            request.history
        )

    # Preserve the original conversation
    updated_history = request.history + [
        {
            "role": "student",
            "content": request.question
        },
        {
            "role": "agent",
            "content": str(answer)
        }
    ]

    return {
        "question": request.question,
        "standalone_question": standalone_question,
        "answer": answer,
        "history": updated_history
    }