from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.course import Course


router = APIRouter(
    prefix="/courses",
    tags=["Courses"]
)


class CourseCreate(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.post("/")
def create_course(
    course: CourseCreate,
    db: Session = Depends(get_db)
):
    new_course = Course(
        name=course.name,
        code=course.code,
        description=course.description
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return {
        "message": "Course created successfully",
        "course": {
            "id": new_course.id,
            "name": new_course.name,
            "code": new_course.code,
            "description": new_course.description,
            "created_at": new_course.created_at
        }
    }



@router.get("/")
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()

    return {
        "courses": [
            {
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "description": course.description,
                "created_at": course.created_at
            }
            for course in courses
        ]
    }

@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        return {
            "message": "Course not found"
        }

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted successfully"
    }