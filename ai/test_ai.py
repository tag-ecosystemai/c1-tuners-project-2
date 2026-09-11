from ingestion.pipeline import ingest_document
from retrieval.vector_store import VectorStore
from features.tutor import answer_question
from features.quiz import generate_quiz
from features.flashcards import generate_flashcards


def main():
    print("=== INGESTING COURSE MATERIAL ===")

    ingest_document(
        file_path="data/sample/thermodynamics.pdf",
        course_id="thermodynamics",
        document_id="thermo_001",
        document_name="Thermodynamics Lecture Notes.pdf"
    )

    print("Ingestion complete.\n")

    store = VectorStore()

    print("=== TESTING TUTOR ===")

    answer = answer_question(
        store,
        "What is the first law of thermodynamics?",
        course_id="thermodynamics"
    )

    print(answer)
    print("\n")

    print("=== TESTING QUIZ ===")

    quiz = generate_quiz(
        store,
        course_id="thermodynamics",
        num_questions=5
    )

    print(quiz)
    print("\n")

    print("=== TESTING FLASHCARDS ===")

    flashcards = generate_flashcards(
        store,
        course_id="thermodynamics",
        num_cards=5
    )

    print(flashcards)


if __name__ == "__main__":
    main()