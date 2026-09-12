def build_tutor_prompt(context, question):
    prompt = f"""
You are a helpful AI study tutor.

Answer the student's question using only the study material provided below.

If the answer cannot be found in the study material, say:
"I couldn't find that in the provided study material."

Study material:
{context}

Student question:
{question}

Answer clearly and explain concepts in a way that helps the student understand.
"""

    return prompt