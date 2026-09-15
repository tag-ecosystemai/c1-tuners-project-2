from ingestion.pipeline import ingest_file
from retrieval.vector_store import VectorStore
from features.tutor import answer_question


def main():
    print("=== INGESTING PDF ===")

    ingest_file(
        file_path="data/sample/thermodynamics.pdf",
        course_id="thermodynamics",
        document_id="thermo_001",
        document_name="Thermodynamics Lecture Notes.pdf"
    )

    print("PDF ingestion complete.\n")

    print("=== INGESTING AUDIO ===")

    ingest_file(
        file_path="data/sample/audio/thermodynamics_lecture_01.mp3",
        course_id="thermodynamics",
        document_id="lecture_001",
        document_name="Thermodynamics Lecture 1.mp3"
    )

    print("Audio ingestion complete.\n")

    store = VectorStore()

    print("=== TESTING PDF + AUDIO RETRIEVAL ===")

    question = (
        "If a system receives 500 joules of heat and does "
        "200 joules of work, what is the change in internal energy?"
    )

    answer = answer_question(
        store,
        question,
        course_id="thermodynamics"
    )

    print("\nQuestion:")
    print(question)

    print("\nAnswer:")
    print(answer)


if __name__ == "__main__":
    main()