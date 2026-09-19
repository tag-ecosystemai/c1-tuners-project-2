from retrieval.retriever import retrieve
from llm.ollama_client import generate_response


def condense_query(question: str, chat_history: list) -> str:
    """
    Rephrases ambiguous follow-up questions (e.g., 'I don't understand')
    into a standalone keyword-rich query for vector search.
    """
    if not chat_history:
        return question

    # Grab the last 4 turns to keep context tight and fast
    recent_history = chat_history[-4:]
    history_str = "\n".join(
        [f"{msg.get('role', 'user')}: {msg.get('content', '')}" for msg in recent_history]
    )

    rewrite_prompt = f"""You are a search query optimizer. Given the chat history and the student's follow-up question, rewrite it into a single standalone search query containing all necessary subject context. 
DO NOT answer the question. Only output the rewritten query. If the question is already clear on its own, output it verbatim.

Chat History:
{history_str}

Follow-up Question: {question}
Standalone Search Query:"""

    rewritten = generate_response(rewrite_prompt).strip()
    return rewritten if rewritten else question


def answer_question(store, question: str, course_id=None, chat_history=None):
    if chat_history is None:
        chat_history = []

    # 1. Ensure follow-up questions search vector store with the correct topic context
    search_query = condense_query(question, chat_history) if chat_history else question

    # 2. Retrieve course chunks based on the standalone search query
    results = retrieve(
        store,
        search_query,
        top_k=3,
        course_id=course_id
    )

    chunks = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    context = "\n\n".join(chunks)

    # 3. Format the recent conversational context for the LLM
    history_str = ""
    if chat_history:
        recent_history = chat_history[-6:]
        formatted_turns = [
            f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}"
            for msg in recent_history
        ]
        history_str = "Conversation History:\n" + "\n".join(formatted_turns) + "\n\n"

    # 4. Refined Pedagogical Prompt
    prompt = f"""You are an intuitive, friendly, and patient peer AI tutor helping a student master their course materials.

Reference Materials:
\"\"\"
{context}
\"\"\"

{history_str}Student Question: {question}

TEACHING INSTRUCTIONS:
- Ground your answer strictly in the Reference Materials provided.
- Never say "The context states", "According to the context", or "The provided text suggests". Speak naturally and authoritatively as an instructor.
- If the student indicates they do not understand, DO NOT repeat the previous explanation. Provide a fresh, simple analogy or a real-world scenario to make it click.
- Structure your response cleanly using bullet points or short paragraphs for readability.
- If the provided materials do not have enough information to answer the question, state honestly: "I don't see that covered in the uploaded course materials."

Answer:"""

    answer = generate_response(prompt).strip()

    # 5. Extract unique sources
    sources = []
    for metadata in metadatas:
        document_name = metadata.get("document_name")
        if document_name and document_name not in sources:
            sources.append(document_name)

    if sources:
        answer += "\n\nSource: " + ", ".join(sources)

    return answer