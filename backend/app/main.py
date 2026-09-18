from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models.course import Course
from app.models.material import Material

from app.routes.courses import router as courses_router
from app.routes.materials import router as materials_router
from app.routes.ask import router as ask_router
from app.routes.quiz import router as quiz_router
from app.routes.flashcards import router as flashcards_router
from app.routes.study_agent import router as study_agent_router


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses_router)
app.include_router(materials_router)
app.include_router(ask_router)
app.include_router(quiz_router)
app.include_router(flashcards_router)
app.include_router(study_agent_router)


@app.get("/")
def home():
    return {"message": "EduAssist backend is running!"}