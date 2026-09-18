from fastapi import APIRouter
from pydantic import BaseModel

from ai.retrieval.vector_store import VectorStore
from ai.features.flashcards import generate_flashcards


router = APIRouter(prefix="/flashcards", tags=["Flashcards"])


class FlashcardsRequest(BaseModel):
    course_id: int
    topic: str | None = None
    num_cards: int = 5


@router.post("/")
def create_flashcards(request: FlashcardsRequest):
    store = VectorStore()

    flashcards = generate_flashcards(
        store,
        course_id=request.course_id,
        topic=request.topic,
        num_cards=request.num_cards
    )

    return {
        "course_id": request.course_id,
        "topic": request.topic,
        "flashcards": flashcards
    }