# Sabilearn — Frontend

## ⚠️ Important: this project must be run through a local server, on port 3000

**Do not open `index.html` by double-clicking it.** The app loads its shared
sidebar/navbar and all its data using `fetch()`, and browsers block `fetch()`
from working when a page is opened directly from disk (the `file://...`
address). If you open it that way, the sidebar, navigation, and most buttons
will not work — this isn't a bug, it's a browser security restriction on
every static site built this way.

If you do open it directly by mistake, the page will now show a message
explaining this instead of just looking broken.

**Port 3000 specifically matters now that the backend is wired in:** the
backend's CORS policy (`app/main.py`, `allow_origins`) only allows requests
from `http://localhost:3000`. If this app is served on any other port, every
call to the backend will be silently blocked by the browser — and because
every backend call has a mock-data fallback, the app will still *look* like
it's working, just without any real data. Run it on port 3000 to actually
test the backend integration.

The backend itself runs separately on port 8000 (`uvicorn main:app --reload`
from the `backend/` folder) — see the backend team's own setup docs for that
side. This project only needs to know its address, which is already set in
`assets/js/api-config.js`.

## How to run it (pick one)

**Option A — Windows, one click**
Double-click **`start-server.bat`** in this folder. It finds Python or
Node.js on your machine, starts a local server, and opens the app in your
browser automatically at `http://localhost:3000`.

**Option B — Mac/Linux**
Run `./start-server.sh` in this folder (Terminal).

**Option C — VS Code**
Install the **Live Server** extension, set its port to **3000** in VS Code
settings (`liveServer.settings.port`), right-click `index.html`, choose
**"Open with Live Server."**

**Option D — Manual**
```
python -m http.server 3000
```
then open `http://localhost:3000/index.html` in your browser.

## Project structure

- `index.html` — landing page
- `auth/` — sign up, log in, forgot password
- `onboarding/` — first-time setup wizard
- `app/` — everything behind login (home, library, courses, study, quizzes,
  flashcards, study plan, progress, notifications, search, account)
- `components/` — shared sidebar/topbar, injected into every app page via
  `assets/js/include.js`
- `assets/css/` — `base.css` (design tokens/typography), `components.css`
  (shared UI pieces), `app-shell.css` (sidebar/topbar layout), `pages/`
  (one file per screen)
- `assets/js/` — `include.js` (shell loader), `dialogs.js` (shared confirm
  modals), `api-config.js` (backend base URL + mock-vs-real-course
  detection), `quiz-engine.js` / `flashcard-engine.js` / `ai-tutor-engine.js`
  / `study-agent-engine.js` (reusable interactive engines), `pages/` (one
  file per screen)
- `data/mock/` — placeholder JSON still used for anything the backend
  doesn't cover yet (auth, accounts, flashcards generation, study plan,
  onboarding) — see the `TODO`/wiring comments at the top of each file in
  `assets/js/pages/*.js` for exactly what's real vs mock right now
