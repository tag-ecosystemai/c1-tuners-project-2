import requests
import json


def generate_response(prompt, json_mode=False):
    payload = {
        "model": "llama3.2:3b",
        "prompt": prompt,
        "stream": False
    }

    if json_mode:
        payload["format"] = "json"

    response = requests.post(
        "http://localhost:11434/api/generate",
        json=payload
    )

    response.raise_for_status()

    result = response.json()

    answer = result["response"]

    if json_mode:
        return json.loads(answer)

    return answer