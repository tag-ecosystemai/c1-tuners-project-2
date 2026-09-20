# TAG AI Engineering Bootcamp --- Cohort 1

## Team Tunners --- Project 2

### Local Study Assistant

An AI-powered study assistant that helps students interact with their
own course materials. Students can upload learning resources, ask
questions grounded in those materials, and use AI-powered study
features.

The project is being developed by **Team Tunners** as part of the **TAG
AI Engineering Bootcamp --- Cohort 1**.

------------------------------------------------------------------------

## Project Overview

Students often have course materials spread across PDFs, lecture notes,
slides, and audio recordings. Finding specific information,
understanding difficult concepts, and revising efficiently can be
challenging.

The Local Study Assistant aims to make those materials easier to use by
providing a course-focused AI learning experience.

The system is designed to:

1.  Organize learning resources by course.
2.  Accept supported course materials for ingestion.
3.  Extract text from PDFs and transcribe supported audio files.
4.  Split extracted content into chunks and create embeddings.
5.  Store and retrieve relevant content using a vector database.
6.  Answer student questions using retrieved course material.
7.  Provide source/document references for tutor responses.
8.  Support additional study tools such as quizzes, flashcards, and a
    Study Agent as those features are implemented.

**Current implementation note:** The core local RAG workflow has been
developed and tested with PDF and audio material. Feature availability
and supported file formats may vary by the current branch.

------------------------------------------------------------------------

## Key Features

### AI Tutor

Ask questions about a course and receive answers based on relevant
content retrieved from the uploaded materials. Follow-up questions can
be used to ask for clarification or a simpler explanation.

### Course-Based Materials

Keep learning resources associated with their course so retrieval can be
scoped to the relevant course.

### PDF and Audio Ingestion

The ingestion pipeline extracts text from text-based PDFs and can
transcribe supported audio using local Whisper. Scanned/image-only PDFs
require OCR support; do not assume OCR is available unless it has been
implemented and tested.

### Retrieval-Augmented Generation (RAG)

The system retrieves relevant chunks from the course's stored materials
and provides them as context to the language model before generating an
answer.

### Study Tools

Quizzes, flashcards, and the Study Agent are part of the broader product
experience. Update this section to reflect which features are fully
implemented and available in the current build.

------------------------------------------------------------------------

## System Architecture

``` text
Student
  |
  v
Next.js Frontend
  |
  v
FastAPI Backend
  |
  +--> Course and Material APIs
  |
  +--> Ingestion Pipeline
  |      |
  |      +--> PDF text extraction (pypdf)
  |      +--> Audio transcription (Whisper)
  |      +--> Text chunking
  |      +--> Embeddings (Nomic Embed Text via Ollama)
  |      +--> ChromaDB (persistent vector store)
  |
  +--> Question Answering
         |
         +--> Course-scoped retrieval
         +--> Retrieved context
         +--> Llama 3.2 3B via Ollama
         +--> Answer and source information
```

The AI components are designed to run locally. Actual offline operation
depends on the required models and dependencies being installed and the
application not relying on external services.

------------------------------------------------------------------------

## Tech Stack

### Frontend

-   Next.js
-   React
-   TypeScript

### Backend

-   Python
-   FastAPI

### AI / Retrieval

-   Ollama
-   Llama 3.2 3B --- text generation
-   Nomic Embed Text --- embeddings
-   ChromaDB --- vector storage and retrieval
-   Whisper --- local audio transcription
-   pypdf --- PDF text extraction

### Development Tools

-   Git
-   GitHub
-   VS Code
-   Swagger UI / FastAPI OpenAPI docs

------------------------------------------------------------------------

## Project Structure

The structure below is a high-level guide. Adjust it to match the
current repository.

``` text
c1-tuners-project-2/
│
├── ai/                         # AI and retrieval pipeline
│   ├── embeddings/              # Embedding utilities
│   ├── ingestion/               # Material ingestion pipeline
│   ├── retrieval/               # Vector search and retrieval
│   └── ...                      # Other AI modules
│
├── backend/                    # FastAPI application and API routes
│
├── frontend/                   # Next.js application
│   ├── app/                    # Application routes and pages
│   ├── components/              # UI components
│   ├── lib/                    # API helpers and utilities
│   └── types/                  # TypeScript types
│
├── docs/                       # Project documentation
├── tests/                      # Tests
└── README.md                   # Project overview and setup guide
```

------------------------------------------------------------------------

## Running Locally

The exact commands may differ depending on your branch and environment.
The steps below describe the general setup; use the project's dependency
files and environment examples as the source of truth.

### 1. Clone the repository

``` bash
git clone https://github.com/tag-ecosystemai/c1-tuners-project-2.git
cd c1-tuners-project-2
```

### 2. Set up Ollama and the models

Install Ollama for your operating system, then make sure the required
models are available:

``` bash
ollama pull llama3.2:3b
ollama pull nomic-embed-text
```

Model downloads require internet access. Once downloaded, local
inference can run without a cloud model API, provided the rest of the
app is configured for local operation.

### 3. Set up the backend

From the backend directory, create and activate a Python virtual
environment, then install the dependencies using the dependency file
provided by the project.

``` bash
cd backend
python -m venv .venv
```

On Windows PowerShell:

``` powershell
.\.venv\Scripts\Activate.ps1
```

On macOS/Linux:

``` bash
source .venv/bin/activate
```

Install dependencies (adjust the filename if your repository uses a
different one):

``` bash
pip install -r requirements.txt
```

Start FastAPI using the project's configured entry point. For example,
if the application is exposed as `main:app`:

``` bash
uvicorn main:app --reload
```

Open the API documentation at:

``` text
http://127.0.0.1:8000/docs
```

### 4. Set up the frontend

In a separate terminal:

``` bash
cd frontend
npm install
```

Create or configure the environment file using `.env.local.example` if
provided. Set the backend API URL to match your local FastAPI server.

Start the frontend:

``` bash
npm run dev
```

Open the local address printed by Next.js, commonly:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

## Local and Offline Use

The project uses locally hosted AI components, including Ollama models,
local embeddings, ChromaDB, and Whisper transcription.

After the required software and models are installed, the core AI
workflow is intended to run locally. However:

-   Initial model and dependency downloads require internet access.
-   Performance depends on the user's CPU, GPU, RAM, and storage.
-   The full application should be tested with the internet disconnected
    before claiming that every feature works completely offline.
-   Any externally hosted frontend, service, or dependency may still
    require internet access.

------------------------------------------------------------------------

## Evaluation and Testing

Testing should cover both individual components and the end-to-end user
experience.

Suggested checks:

-   Upload and ingest a supported text-based PDF.
-   Upload and transcribe a supported audio file.
-   Verify that extracted content is associated with the correct course
    and document.
-   Ask questions answerable from uploaded materials.
-   Check whether responses stay grounded in retrieved context.
-   Verify that source/document references are returned correctly.
-   Confirm that one course's materials do not leak into another
    course's retrieval.
-   Test follow-up questions and response latency.
-   Test the app with internet access disabled after setup, where
    offline operation is expected.

Do not add performance or accuracy metrics unless they have been
measured and documented.

------------------------------------------------------------------------

## Known Limitations and Future Work

Potential areas for continued development include:

-   OCR support for scanned or image-only PDFs.
-   Improving retrieval relevance and answer grounding.
-   More robust source/page-level citations.
-   Reducing response latency and improving the waiting experience.
-   Supporting additional document formats where needed.
-   Completing and evaluating quizzes, flashcards, and Study Agent
    functionality.
-   Improving setup and packaging for easier installation.
-   Testing multiple users and different hardware configurations.
-   Adding formal evaluation datasets and measurable quality metrics.

Update this list as items are completed.

------------------------------------------------------------------------

## Team Workflow

1.  Create a branch before working on a feature or task.
2.  Do not work directly on `main`.
3.  Push changes to your branch.
4.  Open a pull request when the work is ready.
5.  Have another team member review the pull request.
6.  Merge only after review and testing.
7.  Keep commit messages clear and descriptive.
8.  Never commit passwords, API keys, tokens, `.env` files, or other
    secrets.

------------------------------------------------------------------------

## Team Members


* Fawaz Bello
* Emmanuel Akanbi
* Israel Adeoti
* OYETUNJI SHUKRAH
* John Confidence Bello
* Adeniran Treasure

## Mentor

**\Dr. Ikechi Ndukwe**

------------------------------------------------------------------------

## Programme

**TAG AI Engineering Bootcamp --- Cohort 1**
