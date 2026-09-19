from llm.ollama_client import generate_response


def detect_course(question, courses):
    """
    Decides which course a student's question belongs to.
    """
    course_list = "\n".join(
        f"- ID {c['course_id']}: {c['name']}"
        for c in courses
    )

    prompt = f"""You are a routing assistant for a university study application.

Available Courses:
{course_list}

Determine which course ID the student's question relates to.
If it does not match any available course, respond with "unknown".

Student Question: "{question}"

Respond ONLY with valid JSON in this exact structure:
{{"course_id": "the_matching_id_or_unknown"}}
"""

    result = generate_response(prompt, json_mode=True)
    raw_course_id = result.get("course_id")

    if not raw_course_id or str(raw_course_id).lower() == "unknown":
        return None

    target = str(raw_course_id).strip().lower()

    # Match by ID or Name
    for c in courses:
        cid = str(c["course_id"]).strip()
        cname = str(c["name"]).strip().lower()
        if target == cid.lower() or target in cname or cname in target:
            return cid

    return None