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

    print("=== TEST 1: course-specific question ===")
    answer, history = study_agent_ask(
        store,
        "What is the first law of thermodynamics?",
        courses
    )
    print(answer)
    print("\n")

    print("=== TEST 2: cross-course / unknown question ===")
    answer, history2 = study_agent_ask(
        store,
        "What's the capital of France?",
        courses
    )
    print(answer)
    print("\n")

    print("=== TEST 3: follow-up question (needs Turn 1 context) ===")
    answer, history3 = study_agent_ask(
        store,
        "What is entropy?",
        courses
    )
    print(answer)
    answer, history3 = study_agent_ask(
        store,
        "Why does it increase?",
        courses,
        history=history3
    )
    print(answer)
    print("\n")

    print("=== TEST 4: quiz request ===")
    answer, history4 = study_agent_ask(
        store,
        "Quiz me on thermodynamics",
        courses
    )
    print(answer)
    print("\n")

    print("=== TEST 5: flashcard request ===")
    answer, history5 = study_agent_ask(
        store,
        "Make flashcards for thermodynamics",
        courses
    )
    print(answer)
    print("\n")

    print("=== TEST 6: study guide request ===")
    answer, history6 = study_agent_ask(
        store,
        "Create a study guide for thermodynamics",
        courses
    )
    print(answer)
    print("\n")

    print("=== TEST 7: question the material likely doesn't cover ===")
    answer, history7 = study_agent_ask(
        store,
        "How does quantum entanglement relate to thermodynamics?",
        courses
    )
    print(answer)


if __name__ == "__main__":
    main()