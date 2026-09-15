from llm.ollama_client import generate_response


def detect_intent(question):
    """
    Figures out what the student wants to do.

    question: the student's message

    Returns one of: "quiz", "flashcards", "study_guide", "question"
    """

    prompt = f"""You are an intent classifier for a study app.

The student can ask for one of these things:
- "quiz": they want to be tested or quizzed on a topic
- "flashcards": they want flashcards created
- "study_guide": they want a study guide or overview created
- "question": they are asking a normal question or want something explained

Student's message: "{question}"

Respond ONLY with valid JSON in this exact format:
{{"intent": "quiz_or_flashcards_or_study_guide_or_question"}}
"""

    result = generate_response(prompt, json_mode=True)

    intent = result.get("intent", "question")

    if intent not in ("quiz", "flashcards", "study_guide", "question"):
        intent = "question"

    return intent