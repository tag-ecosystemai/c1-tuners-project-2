from ai.features.quiz import generate_quiz

def resolve_question_in_backend(question, history):
    """
    Handles simple follow-up questions without modifying
    the teammate's AI files.
    """

    if not history:
        return question

    previous_student_questions = [
        turn["content"]
        for turn in history
        if turn["role"] == "student"
    ]

    if not previous_student_questions:
        return question

    previous_question = previous_student_questions[-1]

    followup_phrases = [
        "explain that",
        "explain it",
        "explain this",
        "tell me more",
        "give me an example",
        "explain more",
        "in simpler terms",
        "simpler terms",
        "what about that",
        "what about this"
    ]

    question_lower = question.lower()

    is_followup = any(
        phrase in question_lower
        for phrase in followup_phrases
    )

    if not is_followup:
        return question

    # Extract the main topic from a simple previous question.
    topic = previous_question.strip()

    if topic.lower().startswith("what is "):
        topic = topic[8:].rstrip("?")

    elif topic.lower().startswith("what are "):
        topic = topic[9:].rstrip("?")

    elif topic.lower().startswith("define "):
        topic = topic[7:].rstrip("?")

    return f"What is {topic}?"