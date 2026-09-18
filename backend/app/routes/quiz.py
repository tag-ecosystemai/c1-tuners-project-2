from fastapi import APIRouter
from pydantic import BaseModel

from ai.retrieval.vector_store import VectorStore
from ai.features.quiz import generate_quiz


router = APIRouter(prefix="/quiz", tags=["Quiz"])


class QuizRequest(BaseModel):
    course_id: int
    topic: str | None = None
    num_questions: int = 5


@router.post("/")
def create_quiz(request: QuizRequest):
    store = VectorStore()

    quiz = generate_quiz(
        store,
        course_id=request.course_id,
        topic=request.topic,
        num_questions=request.num_questions
    )

    return {
        "course_id": request.course_id,
        "topic": request.topic,
        "quiz": quiz
    }