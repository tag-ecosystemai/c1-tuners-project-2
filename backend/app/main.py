from app.database import Base, engine
from app.models.course import Course
from fastapi import FastAPI
from app.models.material import Material
from app.routes.courses import router as courses_router
from app.routes.materials import router as materials_router

Base.metadata.create_all(bind=engine)

app = FastAPI()


app.include_router(courses_router)
app.include_router(materials_router)


@app.get("/")
def home():
    return {"message": "EduAssist backend is running!"}

