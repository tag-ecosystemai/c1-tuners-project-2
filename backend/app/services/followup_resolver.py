from llm.ollama_client import generate_response

def resolve_question_in_backend(question: str, history: list[dict]) -> str:
    """
    Uses the LLM to resolve follow-ups (e.g., 'was this from my note?')
    into a complete, standalone question based on previous conversation context.
    """
    if not history:
        return question

    # Grab the last 4 turns
    recent_history = history[-4:]
    history_str = "\n".join(
        [f"{turn.get('role', 'student')}: {turn.get('content', '')}" for turn in recent_history]
    )

    prompt = f"""You are an intelligent query reformulation engine.
Given the conversation history and a follow-up query from a student, rewrite the follow-up query into a single, complete, standalone question.

- Preserve the intent of the question.
- Do NOT answer the question.
- If it's already a complete standalone question, return it verbatim.

Chat History:
{history_str}

Follow-up Query: {question}
Standalone Question:"""

    resolved = generate_response(prompt).strip()
    return resolved if resolved else question