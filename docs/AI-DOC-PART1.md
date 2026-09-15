# Local Study Assistant — AI Layer Documentation

## 1. Overview

The Local Study Assistant is an AI-powered study application designed to help students learn from their own course materials.

The AI system is designed to run **locally using Ollama**, which means we do not need paid cloud AI APIs for the core AI functionality.

The current AI layer can:

* Read course materials
* Break the materials into smaller pieces
* Convert those pieces into numerical representations called embeddings
* Store and search those embeddings using Chroma
* Retrieve relevant information when a student asks a question
* Use a local LLM to generate an answer
* Generate quizzes from course materials
* Generate flashcards from course materials

The main architecture is based on **Retrieval-Augmented Generation (RAG)**.

---

# 2. The Main Idea Behind the AI System

A common misunderstanding when building an AI tutor is thinking:

> "We give the AI all the student's PDFs and the AI memorizes them."

That is not what we are doing.

Instead, our system works more like a searchable library.

For example, suppose a student has a course called:

**Thermodynamics**

Inside that course they may upload:

* Thermodynamics Lecture Notes.pdf
* Thermodynamics Textbook.pdf
* Week 3 Slides.pptx
* Tutorial Questions.docx
* Lecturer's Revision Notes.pdf

The system processes all these materials and stores their content in a searchable knowledge base.

When the student asks:

> "What is the first law of thermodynamics?"

the system searches the Thermodynamics materials for the most relevant pieces of information.

Those relevant pieces are then given to the LLM, which uses them to generate the answer.

The simplified flow is:

```text
Course Materials
       ↓
Text Extraction
       ↓
Chunking
       ↓
Embeddings
       ↓
Chroma Vector Database
       ↓
Student Question
       ↓
Retrieve Relevant Information
       ↓
LLM
       ↓
Answer
```

This is the foundation of our AI layer.

---

# 3. What is RAG?

RAG means:

**Retrieval-Augmented Generation**

It combines two different things:

### Retrieval

Find the relevant information from the student's uploaded materials.

### Generation

Give that information to the LLM and ask it to generate a useful response.

So instead of asking the LLM:

> "What do you know about Thermodynamics?"

we ask it:

> "Here are the relevant sections from the student's Thermodynamics materials. Use them to answer the student's question."

This makes the AI much more grounded in the student's actual materials.

---

# 4. Why We Use RAG

A normal LLM has general knowledge from its training data, but it does not automatically know the student's private lecture notes.

For example, a student might upload a lecturer's custom notes containing:

> "According to this lecturer, the first law is represented as..."

The LLM would not automatically know that document.

RAG allows us to give the LLM access to that material at the time the student asks a question.

It also reduces the likelihood of the model answering purely from its general knowledge when the student specifically wants an answer from their course material.

---

# 5. Course-Scoped Knowledge

One of the most important architectural decisions we made is that retrieval is **course-scoped**.

Each piece of content stored in Chroma has metadata such as:

```python
{
    "course_id": "thermodynamics",
    "document_id": "thermo_001",
    "document_name": "Thermodynamics Lecture Notes.pdf"
}
```

This means the system knows:

* Which course the information belongs to
* Which document it came from
* The name of the document

Therefore, if a student is studying Thermodynamics, we can search only the Thermodynamics materials.

This prevents the system from accidentally retrieving information from another course such as Biology or Mathematics.

---

# 6. Project AI Folder Structure

Our current AI structure is:

```text
ai/
│
├── ingestion/
│   ├── __init__.py
│   ├── loaders.py
│   ├── chunker.py
│   └── pipeline.py
│
├── embeddings/
│   ├── __init__.py
│   └── embedder.py
│
├── retrieval/
│   ├── __init__.py
│   ├── vector_store.py
│   └── retriever.py
│
├── llm/
│   ├── __init__.py
│   ├── ollama_client.py
│   └── prompts.py
│
├── features/
│   ├── __init__.py
│   ├── tutor.py
│   ├── quiz.py
│   └── flashcards.py
│
├── data/
│   └── sample/
│
├── test_ai.py
├── test_embedding.py
└── requirements.txt
```

Each folder has a specific responsibility.

---

# 7. Ingestion

The ingestion layer is responsible for taking a document and turning it into text that our AI system can process.

The pipeline is:

```text
Document
   ↓
Text Extraction
   ↓
Chunking
```

Currently, PDF extraction is implemented.

## `loaders.py`

We use `pypdf` to extract text from PDF files.

The basic process is:

```python
reader = PdfReader(file_path)

for page in reader.pages:
    page_text = page.extract_text()
```

The extracted text is then returned as one large string.

---

# 8. Chunking

We cannot simply send an entire textbook or lecture note to the embedding model.

Instead, we break the extracted text into smaller pieces called **chunks**.

Our current chunker uses:

* Chunk size: 1000 characters
* Overlap: 200 characters

Conceptually:

```text
Document
────────────────────────────────────────────

Chunk 1
[--------------------]

             Chunk 2
             [--------------------]

                          Chunk 3
                          [--------------------]
```

The overlap helps preserve context between neighboring chunks.

Our current chunker also removes empty chunks before sending them to the embedding model.

This is important because we discovered during testing that an empty chunk caused Ollama to return an empty embedding.

---

# 9. Embeddings

An embedding is a numerical representation of text.

For example:

```text
"The first law of thermodynamics describes conservation of energy."
```

gets converted into a vector containing hundreds of numbers.

Our embedding model is:

**`nomic-embed-text`**

It produces vectors with **768 dimensions**.

The important idea is:

> Similar meanings produce vectors that are mathematically close to one another.

For example:

```text
"What is the first law of thermodynamics?"
```

and:

```text
"Explain the conservation of energy in thermodynamics."
```

may use different words, but their embeddings should be relatively close because they have similar meanings.

This is what allows semantic search.

---

# 10. `embeddings/embedder.py`

The embedding module communicates with Ollama through its local HTTP API.

The basic flow is:

```text
Python
   ↓
Ollama API
   ↓
nomic-embed-text
   ↓
Embedding vector
```

We have two main functions:

```python
embed_text(text)
```

This converts one piece of text into an embedding.

And:

```python
embed_chunks(chunks)
```

This converts multiple chunks into embeddings.

---

# 11. Vector Database — Chroma

We use **Chroma** as our local vector database.

Chroma stores:

* The original text
* The embedding
* Metadata
* A unique ID

For example:

```text
ID:
abc123

Document:
"The first law of thermodynamics..."

Embedding:
[0.0654, 0.0306, -0.1560, ...]

Metadata:
course_id = thermodynamics
document_id = thermo_001
document_name = Thermodynamics Lecture Notes.pdf
```

Chroma allows us to search these embeddings later.

---

# 12. Why We Need a Vector Database

Imagine a course contains 500 chunks of material.

A student asks:

> "What is the first law of thermodynamics?"

We don't want to send all 500 chunks to the LLM.

Instead:

```text
Student question
       ↓
Embedding
       ↓
Chroma similarity search
       ↓
Top relevant chunks
       ↓
LLM
```

Chroma might identify three chunks that are highly relevant.

Only those chunks are then provided to the LLM.

This makes the system more efficient and keeps the LLM focused on relevant information.

---

# 13. Metadata

Metadata is extremely important in our architecture.

Every chunk currently stores:

```python
{
    "course_id": "thermodynamics",
    "document_id": "thermo_001",
    "document_name": "Thermodynamics Lecture Notes.pdf"
}
```

This allows us to filter searches.

For example:

```text
Search:
"What is entropy?"

Course:
thermodynamics
```

Chroma searches only chunks where:

```text
course_id = thermodynamics
```

This is how our system keeps knowledge separated by course.

---

# 14. Source Awareness

Because every chunk contains its document name, the system already knows which material a retrieved piece came from.

For example:

```text
Chunk:
"The first law states..."

Source:
Thermodynamics Lecture Notes.pdf
```

This means our architecture can provide source information alongside the AI's answer.

We can later expose this to the frontend as:

```text
Answer:
The first law of thermodynamics states...

Source:
Thermodynamics Lecture Notes.pdf
```

We can extend the metadata later to include page numbers, chapters, sections, etc.

---

# 15. Retrieval

The retrieval layer handles searching Chroma.

The process is:

```text
Student question
       ↓
Embed question
       ↓
Search Chroma
       ↓
Retrieve top relevant chunks
```

Our retriever accepts:

* The vector store
* The student's question
* Number of results to retrieve
* Course ID

Example:

```python
retrieve(
    store,
    question,
    top_k=3,
    course_id="thermodynamics"
)
```

`top_k=3` means we ask Chroma for the three most relevant chunks.

---

# 16. The Local LLM

For generation, we use:

**`llama3.2:3b`**

The model runs locally through Ollama.

We communicate with Ollama using its local API.

The generation flow is:

```text
Python
   ↓
Ollama API
   ↓
llama3.2:3b
   ↓
Generated response
```

This keeps the project local and avoids paid external LLM APIs.

---

# 17. Prompt Construction

Before sending information to the LLM, we construct a prompt.

For the tutor, the prompt contains:

```text
Instructions
+
Retrieved study material
+
Student question
```

Conceptually:

```text
You are a helpful AI study tutor.

Use only the study material provided.

Study material:
[retrieved chunks]

Student question:
[student question]
```

This helps ground the response in the student's course materials.

---

# 18. Tutor

The tutor is currently our main RAG feature.

The implementation is:

```text
Student question
       ↓
Embed question
       ↓
Search Chroma
       ↓
Retrieve relevant course chunks
       ↓
Build prompt
       ↓
Llama 3.2
       ↓
Answer
```

The tutor function:

```python
answer_question(
    store,
    question,
    course_id
)
```

retrieves relevant information and sends it to the LLM.

---

# 19. Quiz Generation

The quiz generator uses the same RAG infrastructure.

We do not create a separate knowledge base for quizzes.

Instead:

```text
Course
   ↓
Chroma
   ↓
Relevant material
   ↓
Llama 3.2
   ↓
Quiz
```

The quiz generator currently produces five multiple-choice questions.

Each question contains:

```python
{
    "question": "...",
    "options": [
        "...",
        "...",
        "...",
        "..."
    ],
    "answer": "...",
    "explanation": "..."
}
```

We ask Ollama to return JSON so that the backend can easily send structured quiz data to the frontend.

---

# 20. Flashcard Generation

Flashcards follow the same architecture.

```text
Course
   ↓
Chroma
   ↓
Relevant material
   ↓
Llama 3.2
   ↓
Flashcards
```

Each flashcard contains:

```python
{
    "question": "...",
    "answer": "..."
}
```

The output is also returned as JSON.

This makes it easy for the frontend to display the cards.

---

# 21. Why Tutor, Quiz and Flashcards Share the Same RAG System

We deliberately avoid building three completely separate AI systems.

Instead, we have one underlying knowledge system:

```text
                    Course Materials
                          ↓
                    Ingestion
                          ↓
                     Chroma
                          ↓
              ┌───────────┼───────────┐
              ↓           ↓           ↓
            Tutor        Quiz      Flashcards
              ↓           ↓           ↓
            Llama       Llama        Llama
```

This is much easier to maintain.

If we improve document ingestion or retrieval, all three features benefit.

---

# 22. Structured Output

Tutor responses are normal text.

Quiz and flashcard responses need structure.

For example, the frontend needs to know:

```text
Question
Options
Correct answer
Explanation
```

Instead of receiving an unstructured paragraph, we ask Ollama to return JSON.

Our Ollama client therefore supports:

```python
generate_response(prompt)
```

for normal responses, and:

```python
generate_response(prompt, json_mode=True)
```

for structured responses.

---

# 23. Current Models

The current local AI stack is:

| Component            | Technology         |
| -------------------- | ------------------ |
| LLM                  | `llama3.2:3b`      |
| Embedding model      | `nomic-embed-text` |
| Vector database      | Chroma             |
| LLM runtime          | Ollama             |
| PDF extraction       | pypdf              |
| Programming language | Python             |

Everything runs locally.

---

# 24. Dependencies

Our Python environment currently uses libraries including:

```text
pypdf
python-pptx
python-docx
requests
chromadb
```

These should be maintained in:

```text
requirements.txt
```

---

# 25. End-to-End Architecture

The complete AI pipeline currently looks like this:

```text
                    USER UPLOADS MATERIAL
                              │
                              ▼
                    ┌──────────────────┐
                    │ Document Loader  │
                    └────────┬─────────┘
                             │
                             ▼
                       Extract Text
                             │
                             ▼
                    ┌──────────────────┐
                    │     Chunker      │
                    └────────┬─────────┘
                             │
                             ▼
                    Text Chunks
                             │
                             ▼
                    ┌──────────────────┐
                    │  Embedding Model │
                    │nomic-embed-text  │
                    └────────┬─────────┘
                             │
                             ▼
                    Embedding Vectors
                             │
                             ▼
                    ┌──────────────────┐
                    │      Chroma      │
                    │  Vector Database │
                    └──────────────────┘


              STUDENT ASKS A QUESTION
                         │
                         ▼
                 Embed the question
                         │
                         ▼
                 Search Chroma
                         │
                         ▼
              Relevant course chunks
                         │
                         ▼
                Build LLM prompt
                         │
                         ▼
                 ┌───────────────┐
                 │  Llama 3.2 3B │
                 └───────┬───────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
           Tutor        Quiz     Flashcards
```

---

# 26. What We Have Tested

We have successfully tested the complete pipeline using a Thermodynamics PDF.

The test confirmed:

### PDF extraction

Working.

### Chunking

Working.

The sample document produced multiple chunks.

### Embeddings

Working.

`nomic-embed-text` successfully generated 768-dimensional embeddings.

### Chroma

Working.

The document chunks can be stored and retrieved.

### Tutor

Working.

The system successfully answered:

> "What is the first law of thermodynamics?"

using retrieved course material.

### Quiz

Working.

The system generated five structured multiple-choice questions.

### Flashcards

Working.

The system generated five structured flashcards.

Therefore, the core AI pipeline is currently functional.

---

# 27. Important Debugging Lesson

During testing, we encountered an issue where Ollama returned:

```python
{
    "embeddings": []
}
```

Initially this looked like an embedding-model problem.

We tested the model directly and discovered:

```text
nomic-embed-text
```

was working correctly.

The actual problem was that our chunker was producing an empty first chunk:

```text
First chunk length: 0
```

Ollama cannot create a meaningful embedding for an empty string.

We fixed the chunker so that:

* Input text is stripped
* Empty input is rejected
* Empty chunks are not added

This is an important lesson in AI engineering:

> When an AI component fails, don't immediately assume the model is the problem. Trace the data through the entire pipeline.

---

# 28. Current Limitations

The AI layer is working, but it is still an MVP.

Current limitations include:

### File support

PDF ingestion is currently implemented.

Word and PowerPoint loaders still need to be properly connected to the ingestion pipeline.

### Source citations

The document name is already stored as metadata.

We still need to expose the source information cleanly in the tutor response for the frontend.

### Page-level citations

We currently store the document name, but not detailed page/section information.

That can be added later.

### Duplicate documents

We do not yet have a complete duplicate detection or document replacement system.

### Error handling

More production-level error handling will be added around:

* Missing files
* Invalid documents
* Ollama not running
* Empty course materials
* Failed retrieval
* Invalid LLM output

### Authentication / multi-user isolation

The current MVP does not yet require authentication.

Later, metadata can include something such as:

```python
student_id
```

so each student's knowledge base can be isolated.

---

# 29. What We Are NOT Doing

We are not:

* Training our own LLM
* Fine-tuning Llama
* Sending student documents to a cloud AI provider
* Creating a separate vector database for every feature
* Giving every course a separate LLM
* Asking the LLM to memorize all uploaded documents

Instead, we are building a **local RAG application** around existing open-source models.

---

# 30. What Comes Next

The next major AI component is the **Study Agent**.

The Study Agent sits above the course-level RAG systems.

For example, a student might say:

> "I want to study Thermodynamics."

The Study Agent should understand that the student is referring to the Thermodynamics course and route the request to the appropriate course context.

Conceptually:

```text
Student
   ↓
Study Agent
   ↓
Identify course / intent
   ↓
Thermodynamics
   ↓
Thermodynamics knowledge base
   ↓
Tutor / Quiz / Flashcards
```

The Study Agent is therefore different from the Tutor.

The Tutor answers questions **inside a course**.

The Study Agent operates at a **higher level**, helping understand what the student wants to study and routing the request appropriately.

---

# 31. Summary for the Team

The AI layer currently has four major foundations:

### 1. Ingestion

Turns student documents into usable text.

### 2. Embeddings + Chroma

Turns text into searchable knowledge.

### 3. RAG + Llama

Retrieves relevant course material and uses it to answer questions.

### 4. AI Features

Uses the same RAG foundation to provide:

* Tutor
* Quiz
* Flashcards

The architecture is intentionally modular so that the frontend and backend can interact with the AI layer without needing to know how embeddings, vector search or LLM prompting work internally.

The eventual application flow will be:

```text
Student
   ↓
Frontend
   ↓
Backend API
   ↓
AI Layer
   ↓
Course Knowledge Base
   ↓
Local LLM
   ↓
AI Response
   ↓
Backend
   ↓
Frontend
```

Our current goal is to finish the remaining AI components, test the complete system, and then expose the AI functionality through the backend API for the frontend team.
