#  Backend – Setup & Testing Guide

This document explains how to set up and test the backend on a local PC.

## 1. Backend Responsibilities

The backend handles:

* Course creation and retrieval
* Study material upload
* PDF processing
* Audio lecture processing
* Audio transcription using Whisper
* Text chunking
* Embedding generation
* ChromaDB vector storage
* Retrieval of relevant study material
* Connection to the AI/RAG functionality
* API endpoints for the frontend

---

## 2. Requirements

Install:

* Python 3.12+
* Git
* Ollama
* FFmpeg

Check the installations:

```bash
python --version
git --version
ollama --version
ffmpeg -version
```

---

## 3. Clone the Repository

Clone the project:

```bash
git clone <REPOSITORY-URL>
```

Go into the backend:

```bash
cd c1-tuners-project-2/backend
```

---

## 4. Create Virtual Environment

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

---

## 5. Install Python Dependencies

```bash
pip install -r requirements.txt
```

If necessary:

```bash
python -m pip install -r requirements.txt
```

---

# 6. Set Up Ollama

EduAssist uses Ollama for local AI generation.

The project uses:

```text
Model: llama3.2:3b
Ollama API: http://localhost:11434/api/generate
```

Pull the model:

```bash
ollama pull llama3.2:3b
```

Check that it is installed:

```bash
ollama list
```

You should see:

```text
llama3.2:3b
```

Make sure Ollama is running before testing the AI-related endpoints.

---

# 7. AI Generation

The backend connects to Ollama through the local API.

The generation request follows this structure:

```python
payload = {
    "model": "llama3.2:3b",
    "prompt": prompt,
    "stream": False
}
```

For structured JSON responses, JSON mode can be enabled:

```python
payload["format"] = "json"
```

The backend sends the request to:

```text
http://localhost:11434/api/generate
```

The AI response is then returned to the backend.

---

# 8. Run the Backend

From the `backend` directory:

```bash
uvicorn main:app --reload
```

If successful, you should see:

```text
Uvicorn running on http://127.0.0.1:8000
```

Open:

```text
http://127.0.0.1:8000/docs
```

This opens the FastAPI Swagger documentation.

---

# 9. Test the Backend

## Test 1 – Get Courses

In Swagger:

```text
GET /courses
```

Click:

**Try it out → Execute**

A successful response should return the available courses.

Example:

```json
[
  {
    "id": 1,
    "name": "Thermodynamics",
    "code": "PHY 401",
    "description": "Introduction to Thermodynamics"
  }
]
```

---

## Test 2 – Create a Course

Use the course creation endpoint.

Example:

```json
{
  "name": "Machine Learning",
  "code": "CSC 402",
  "description": "Introduction to Machine Learning"
}
```

Execute the request.

A successful response should return the newly created course.

---

# 10. Test Material Upload

Use the material upload endpoint from:

```text
http://127.0.0.1:8000/docs
```

Select:

* Course ID
* PDF or audio file

Then click **Execute**.

A successful request should return a response similar to:

```json
{
  "message": "Material uploaded successfully"
}
```

---

# 11. Test PDF Processing

Upload a PDF belonging to a course.

The backend processes it through:

```text
PDF
 ↓
Text Extraction
 ↓
Text Chunking
 ↓
Embeddings
 ↓
ChromaDB
```

After successful processing, the content becomes available to the retrieval system.

---

# 12. Test Audio Processing

Upload an audio lecture.

The backend uses Whisper to convert the recording into text.

```text
Audio
 ↓
Whisper
 ↓
Transcript
 ↓
Text Chunking
 ↓
Embeddings
 ↓
ChromaDB
```

A successful upload should return a successful processing response.

---

# 13. Test Question Answering

After uploading a study material, test the question-answering endpoint.

Example question:

```text
What was discussed in the lecture recording?
```

The system should:

```text
Question
   ↓
Retrieve relevant content
   ↓
Send context to AI
   ↓
Ollama (llama3.2:3b)
   ↓
Generate answer
```

The returned answer should be based on the uploaded study material.

---

# 14. ChromaDB

The backend uses ChromaDB for local vector storage.

The database is stored locally in:

```text
data/chroma/
```

This directory is included in `.gitignore`.

Each team member will create their own local ChromaDB data after processing materials.

**Do not commit `data/chroma/` to GitHub.**

---

# 15. Audio Requirements

For audio processing, FFmpeg may be required.

Check:

```bash
ffmpeg -version
```

If FFmpeg is not recognized, install it and make sure it is available in the system PATH.

---

# 16. Verify the Complete Backend

The backend is working correctly when you can successfully:

1. Start FastAPI.
2. Open `/docs`.
3. Create a course.
4. Retrieve courses.
5. Upload a PDF.
6. Process the PDF.
7. Upload an audio lecture.
8. Transcribe the audio.
9. Store the processed content in ChromaDB.
10. Ask a question about the uploaded material.
11. Receive an AI-generated response through Ollama.

---

# 17. Troubleshooting

### Ollama is not recognized

Restart the terminal after installing Ollama and run:

```bash
ollama --version
```

### Model is missing

Run:

```bash
ollama pull llama3.2:3b
```

### Backend does not start

Make sure the virtual environment is active:

```bash
venv\Scripts\activate
```

Then reinstall dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
uvicorn main:app --reload
```

### Port 8000 is already in use

Use another port:

```bash
uvicorn main:app --reload --port 8001
```

Then open:

```text
http://127.0.0.1:8001/docs
```

---

## Backend Status

The backend provides the API and processing layer that connects course materials to the team's existing RAG/AI functionality.

The AI generation uses the team's existing **Ollama + Llama 3.2 3B** setup rather than maintaining a separate model-generation implementation.
