from embeddings.embedder import embed_text


def retrieve(store, question, top_k=3, course_id=None):
    question_embedding = embed_text(question)

    results = store.search(
        question_embedding,
        top_k=top_k,
        course_id=course_id
    )

    return results