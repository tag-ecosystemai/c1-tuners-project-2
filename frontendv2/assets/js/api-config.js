// SABILEARN — API configuration
//
// Points at the FastAPI backend (see backend/BACKEND_SETUP.md). The backend
// implements courses, materials, /ask/ (AI Tutor), /quiz/, /flashcards/, and
// /study-agent/. This frontend calls all of them for real (integer-id)
// courses: courses, materials, /ask/, /quiz/ (generation is played back
// live in quiz-taking.html), /flashcards/ (generation is played back live
// in flashcard-study.html) and /study-agent/. The backend has no database
// tables yet for generated quizzes/flashcards or quiz-attempt history, so
// those are cached locally after being generated — see
// generated-content-store.js — rather than invented as mock data. Anything
// unrelated to courses/materials/AI (auth, accounts, study plan,
// onboarding, notifications, progress analytics) has no backend yet and
// keeps running on the local mock JSON under data/mock/.
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
async function sabilearnFetch(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Shared helper for the very common "get the real courses from GET
// /courses/" call, used by every page that needs to merge real backend
// courses with the local mock/demo courses (upload dropdowns, My Courses,
// Library, Home, quiz/flashcard setup, etc). Returns [] (never throws) so
// callers can always safely concat it with their mock course list.
async function sabilearnGetBackendCourses() {
  try {
    const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/courses/`, {}, 8000);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    const data = await res.json();
    return data.courses || [];
  } catch (err) {
    console.warn('Sabilearn: could not reach backend for course list.', err);
    return [];
  }
}

// Converts a raw backend course row ({id, name, code, description,
// created_at}) into the shape the frontend's UI already uses everywhere
// else (id as string, title instead of name, plus neutral defaults for
// fields the backend doesn't track like progress/instructor/materials).
function sabilearnBackendCourseToUi(c, materialsCount = 0) {
  return {
    id: String(c.id),
    code: c.code || 'COURSE',
    title: c.name,
    description: c.description || '',
    instructor: 'You',
    color: 'blue',
    materialsCount,
    progress: 0,
    topics: [],
    isBackend: true,
  };
}

// ---------------------------------------------------------------------
// Shared UI helpers
// ---------------------------------------------------------------------

// Escapes text before it is dropped into innerHTML. Lives here (not in
// markdown.js) because every page that loads markdown.js also loads this
// file first, and pages that don't render markdown still need it for
// filenames, quiz text, etc.
function sabilearnEscapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Mock/demo data and real backend data are shown side by side on every
// screen. This small pill marks the real ones so the two are easy to tell
// apart. Change the label in one place.
const SABILEARN_BACKEND_LABEL = 'Backend';
function sabilearnBackendTag() {
  return `<span class="badge backend-tag">${SABILEARN_BACKEND_LABEL}</span>`;
}

// Full-area error state with a Retry button, for when a REAL backend item
// (course, material, quiz, deck) fails to load. Mock items never reach
// this; a failed backend load must never be replaced by mock content
// pretending to be the real thing.
function sabilearnRenderPageError(container, { title, message, onRetry, backHref, backLabel } = {}) {
  container.innerHTML = `
    <div class="page-empty-state">
      <div class="icon">⚠</div>
      <h3>${sabilearnEscapeHtml(title || 'Something went wrong')}</h3>
      <p>${sabilearnEscapeHtml(message || 'We could not load this from the backend.')}</p>
      <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        ${onRetry ? '<button type="button" class="btn btn-primary" data-page-retry>Retry</button>' : ''}
        ${backHref ? `<a href="${sabilearnEscapeHtml(backHref)}" class="btn btn-secondary">${sabilearnEscapeHtml(backLabel || 'Go back')}</a>` : ''}
      </div>
    </div>
  `;
  if (onRetry) container.querySelector('[data-page-retry]').addEventListener('click', onRetry);
}
