from llm.ollama_client import generate_response


def format_history(history):
    """
    history: list of {"role": "student" or "agent", "content": "..."}
    Returns the conversation so far as plain text.
    """
    lines = []
    for turn in history:
        speaker = "Student" if turn["role"] == "student" else "Agent"
        lines.append(f"{speaker}: {turn['content']}")
    return "\n".join(lines)


def resolve_followup(question, history):
    """
    Turns a follow-up question that depends on earlier context
    (e.g. "explain that more simply") into a standalone question,
    using the conversation history so far.

    If there's no history yet, just returns the question unchanged.
    """
    if not history:
        return question

    transcript = format_history(history)

    prompt = f"""Here is a conversation between a student and a study assistant:

{transcript}

The student just asked this new question, which may depend on the conversation above:
"{question}"

Rewrite the student's question as a standalone question that makes full sense
on its own, without needing the earlier conversation. If it is already standalone,
just repeat it unchanged.

Respond ONLY with valid JSON in this exact format:
{{"standalone_question": "the rewritten question"}}
"""

    result = generate_response(prompt, json_mode=True)

    return result.get("standalone_question", question)