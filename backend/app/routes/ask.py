from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional

from ai.retrieval.vector_store import VectorStore
from ai.features.tutor import answer_question

router = APIRouter(prefix="/ask", tags=["AI Tutor"])


class AskRequest(BaseModel):
    question: str
    course_id: int
    chat_history: List[Dict[str, str]] = []


@router.post("/")
def ask_question(request: AskRequest):
    store = VectorStore()

    answer = answer_question(
        store,
        request.question,
        course_id=request.course_id,
        chat_history=request.chat_history
    )

    return {
        "question": request.question,
        "course_id": request.course_id,
        "answer": answer
    }