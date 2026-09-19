// SABILEARN — API configuration
//
// Points at the FastAPI backend (see backend/BACKEND_SETUP.md). The backend
// implements courses, materials, /ask/ (AI Tutor), /quiz/, /flashcards/, and
// /study-agent/. Of these, this frontend currently calls courses, materials,
// /ask/, /quiz/ (setup only — quiz-taking.html can't play back a
// backend-generated quiz yet) and /study-agent/. /flashcards/ is not called
// yet — flashcard generation still runs on mock data. Everything unrelated
// to courses/materials/AI (auth, accounts, study plan, onboarding) has no
// backend yet and keeps running on the local mock JSON under data/mock/.
//
// Must be served on http://localhost:3000 — the backend's CORS only allows
// that origin (see backend/app/main.py, allow_origins). Run start-server.bat
// / start-server.sh, which are already set to port 3000.
window.SABILEARN_API_BASE = window.SABILEARN_API_BASE || 'http://localhost:8000';

// Backend courses/materials use plain integer, auto-incrementing IDs
// (SQLite). Mock demo data uses string slugs like "csc301". Anything that
// isn't a bare integer is treated as mock-only and is never sent to the
// backend — this is how pages decide whether to call the real API or fall
// back to the existing mock behavior.
function isBackendId(id) {
  return /^\d+$/.test(String(id ?? ''));
}

// Every backend call in this app should go through this instead of raw
// fetch(). It adds a timeout so a hung/slow backend (e.g. the AI service
// still being finished, or a slow model response) fails the same way an
// unreachable one does — falling back to mock data — rather than leaving
// the UI stuck waiting forever. Default timeout is generous (15s) since AI
// generation endpoints (/ask/, /quiz/, /study-agent/) can genuinely take a
// few seconds; pass a shorter one for simple CRUD calls if needed.
async function sabilearnFetch(url, options = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}
