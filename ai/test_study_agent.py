from ingestion.pipeline import ingest_document
from retrieval.vector_store import VectorStore
from features.study_agent import study_agent_ask


def main():
    ingest_document(
        file_path="data/sample/thermodynamics.pdf",
        course_id="thermodynamics",
        document_id="thermo_001",
        document_name="Thermodynamics Lecture Notes.pdf"
    )

    store = VectorStore()

    courses = [
        {"course_id": "thermodynamics", "name": "Thermodynamics"},
        {"course_id": "biology", "name": "Biology"},
    ]

    print("=== TURN 1: initial question ===")
    answer, history = study_agent_ask(
        store,
        "What is entropy?",
        courses
    )
    print(answer)
    print("\n")

    print("=== TURN 2: follow-up, depends on turn 1 ===")
    answer, history = study_agent_ask(
        store,
        "Why does it increase?",
        courses,
        history=history
    )
    print(answer)
    print("=== TURN 3: study guide generation ===")
    from features.study_agent import generate_study_guide
    guide = generate_study_guide(store, course_id="thermodynamics")
    print(guide)

if __name__ == "__main__":
    main()