from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import os
import shutil

from app.database import SessionLocal
from app.models.course import Course
from app.models.material import Material
from ai.ingestion.pipeline import ingest_document

router = APIRouter(
    prefix="/materials",
    tags=["Materials"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload")
def upload_material(
    course_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        return {
            "message": "Course not found"
        }

    os.makedirs("uploads", exist_ok=True)

    file_path = os.path.join("uploads", file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    material = Material(
        course_id=course_id,
        filename=file.filename,
        file_type=file.content_type,
        file_path=file_path
    )

    db.add(material)
    db.commit()
    db.refresh(material)

    ingest_document(
    file_path=file_path,
    course_id=course_id,
    document_id=material.id,
    document_name=file.filename
)

    return {
        "message": "Material uploaded successfully",
        "material": {
            "id": material.id,
            "course_id": material.course_id,
            "filename": material.filename,
            "file_type": material.file_type,
            "file_path": material.file_path,
            "uploaded_at": material.uploaded_at
        }
    }

@router.get("/course/{course_id}")
def get_course_materials(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        return {
            "message": "Course not found"
        }

    materials = (
        db.query(Material)
        .filter(Material.course_id == course_id)
        .all()
    )

    return {
        "course_id": course_id,
        "course_name": course.name,
        "course_code": course.code,
        "materials": [
            {
                "id": material.id,
                "filename": material.filename,
                "file_type": material.file_type,
                "file_path": material.file_path,
                "uploaded_at": material.uploaded_at
            }
            for material in materials
        ]
    }
