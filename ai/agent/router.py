from llm.ollama_client import generate_response


def detect_course(question, courses):
    """
    Figures out which course a student's question belongs to.

    question: the student's message, e.g. "What is entropy?"
    courses: list of dicts, e.g.
        [
            {"course_id": "thermodynamics", "name": "Thermodynamics"},
            {"course_id": "biology", "name": "Biology"},
        ]

    Returns the matching course_id (string), or None if no course matches.
    """

    course_list = "\n".join(
        f"- {c['course_id']}: {c['name']}"
        for c in courses
    )

    prompt = f"""You are a routing assistant for a study app.

Here are the available courses:
{course_list}

Given the student's question below, decide which course_id it belongs to.
If it does not clearly match any course, respond with "unknown".

Question: "{question}"

Respond ONLY with valid JSON in this exact format:
{{"course_id": "the_matching_course_id_or_unknown"}}
"""

    result = generate_response(prompt, json_mode=True)

    course_id = result.get("course_id")

    if course_id == "unknown" or course_id is None:
        return None

    return course_id