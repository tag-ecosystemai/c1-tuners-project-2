// SABILEARN — Home dashboard behavior

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

const FOCUS_ICONS = { review: '\u{1F4A1}', quiz: '\u2756', flashcards: '\u23F1' };

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function renderContinueLearning(data) {
  document.getElementById('continue-course-tag').textContent = data.courseCode + ' · ' + data.courseTitle;
  document.getElementById('continue-lecture-title').textContent = data.lectureTitle;
  document.getElementById('continue-progress-fill').style.width = data.progress + '%';
  document.getElementById('continue-progress-label').textContent = data.progress + '% complete';
  document.getElementById('continue-btn').href = `study/study-session.html?course=${data.courseId}&topic=${encodeURIComponent(data.topic || '')}`;
}

function renderComingUp(data) {
  document.getElementById('coming-up-title').textContent = data.title;
  document.getElementById('coming-up-sub').textContent = data.subtitle;
  document.getElementById('coming-up-days-num').textContent = data.daysRemaining;
  document.getElementById('coming-up-date').textContent = data.date;
}

function renderFocus(list) {
  const esc = sabilearnEscapeHtml;
  const wrap = document.getElementById('focus-grid');
  wrap.innerHTML = list.map((item) => {
    const tag = item.isBackend ? sabilearnBackendTag() : '';
    const inner = `
      <div class="focus-icon">${FOCUS_ICONS[item.type] || '\u2726'}</div>
      <div class="focus-card-body">
        <div class="focus-card-title">${esc(item.title)}${tag}</div>
        <div class="focus-card-meta">${esc(item.duration)} · ${esc(item.course)}</div>
      </div>
      <span class="focus-arrow">→</span>`;
    return item.href
      ? `<a href="${esc(item.href)}" class="card focus-card" style="text-decoration:none; color:inherit;">${inner}</a>`
      : `<div class="card focus-card">${inner}</div>`;
  }).join('');
}

function renderCourseHealth(courses) {
  const esc = sabilearnEscapeHtml;
  const wrap = document.getElementById('course-health-list');
  wrap.innerHTML = courses.map((c) => `
    <div class="progress-row">
      <svg class="progress-ring-mini" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border)" stroke-width="4"/>
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-primary)" stroke-width="4"
          stroke-dasharray="${2 * Math.PI * 16}" stroke-dashoffset="${2 * Math.PI * 16 * (1 - c.progress / 100)}"
          stroke-linecap="round" transform="rotate(-90 20 20)"/>
      </svg>
      <div class="progress-row-body">
        <div class="progress-row-top"><span>${esc(c.code)} · ${esc(c.title)}${c.isBackend ? sabilearnBackendTag() : ''}</span><span>${c.progress}%</span></div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${c.progress}%"></div></div>
      </div>
    </div>
  `).join('');
}

function renderWeakAreas(list) {
  const esc = sabilearnEscapeHtml;
  const wrap = document.getElementById('weak-areas-list');
  wrap.innerHTML = list.map((w) => `
    <div class="weak-row">
      <div>
        <div class="weak-row-topic">${esc(w.topic)}${w.isBackend ? sabilearnBackendTag() : ''}</div>
        <div class="weak-row-course">${esc(w.course)}</div>
      </div>
      <span class="badge tag-${esc(w.confidence)}">${esc(w.confidence)}</span>
    </div>
  `).join('');
}

function renderActivity(list) {
  const esc = sabilearnEscapeHtml;
  const wrap = document.getElementById('activity-list');
  wrap.innerHTML = list.map((a) => `
    <div class="activity-row">
      <div>
        <div>${esc(a.text)}${a.isBackend ? sabilearnBackendTag() : ''}</div>
        <div class="activity-row-detail">${esc(a.detail)}</div>
      </div>
      <span class="activity-row-time">${esc(a.time)}</span>
    </div>
  `).join('');
}

// ---------------------------------------------------------------------
// Real (backend-course) data for the dashboard, shown next to the demo
// widgets. Everything here comes from quizzes/decks actually generated
// from a real backend course, or from the learner's real quiz attempts
// (cached in the browser — see generated-content-store.js). Only courses
// that still exist on the backend are included; if the backend can't be
// reached there are no backend courses, so nothing is shown.
// ---------------------------------------------------------------------
function buildBackendHomeData(backendCourses) {
  const live = new Set(backendCourses.map((c) => String(c.id)));
  const quizzes = getAllGeneratedQuizzes().filter((q) => live.has(String(q.courseId)));
  const decks = getAllGeneratedDecks().filter((d) => live.has(String(d.courseId)));
  const attempts = getQuizHistory().filter((h) => h.source === 'backend' && live.has(String(h.courseId)));
  const dayOf = (iso) => (iso ? new Date(iso).toLocaleDateString() : '');

  // Recent activity, newest first.
  const activity = [
    ...attempts.map((h) => ({
      text: `Completed ${h.title}`,
      detail: `${h.courseCode} · ${h.score}/${h.total}`,
      time: h.date || dayOf(h.at),
      at: h.at || '',
    })),
    ...quizzes.map((q) => ({
      text: `Generated ${q.title}`,
      detail: `${q.courseCode} · ${q.questions.length} question${q.questions.length === 1 ? '' : 's'}`,
      time: dayOf(q.createdAt),
      at: q.createdAt || '',
    })),
    ...decks.map((d) => ({
      text: `Generated ${d.title}`,
      detail: `${d.courseCode} · ${d.totalCards} card${d.totalCards === 1 ? '' : 's'}`,
      time: dayOf(d.createdAt),
      at: d.createdAt || '',
    })),
  ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5).map((a) => ({ ...a, isBackend: true }));

  // Today's focus: generated quizzes not attempted yet, and decks with
  // cards due.
  const attempted = new Set(attempts.map((h) => h.quizId));
  const focus = [
    ...quizzes.filter((q) => !attempted.has(q.id)).map((q) => ({
      title: `Take ${q.title}`,
      duration: `${q.questions.length} question${q.questions.length === 1 ? '' : 's'}`,
      course: q.courseCode,
      type: 'quiz',
      href: `quizzes/quiz-taking.html?quiz=${q.id}&course=${q.courseId}`,
    })),
    ...decks.filter((d) => d.dueCount > 0).map((d) => ({
      title: `Review ${d.title}`,
      duration: `${d.dueCount} card${d.dueCount === 1 ? '' : 's'}`,
      course: d.courseCode,
      type: 'flashcards',
      href: `flashcards/flashcard-study.html?deck=${d.id}&course=${d.courseId}`,
    })),
  ].slice(0, 3).map((f) => ({ ...f, isBackend: true }));

  // Weak areas: the latest real score on each backend quiz, when it was low.
  const latestByQuiz = {};
  attempts.forEach((h) => { if (!latestByQuiz[h.quizId]) latestByQuiz[h.quizId] = h; }); // history is newest-first
  const weakAreas = Object.values(latestByQuiz).map((h) => {
    const pct = h.total ? Math.round((h.score / h.total) * 100) : 100;
    const quiz = quizzes.find((q) => q.id === h.quizId);
    return { topic: quiz?.topic || h.title, course: h.courseCode, confidence: pct < 50 ? 'weak' : pct < 75 ? 'developing' : null, isBackend: true };
  }).filter((w) => w.confidence);

  return { activity, focus, weakAreas };
}

document.addEventListener('sabilearn:shell-ready', async () => {
  // The demo widgets (mock JSON) stay, and real backend data is shown next
  // to them, marked with a "Backend" pill: real courses in Course Health,
  // and, from quizzes/decks generated from real courses and real quiz
  // attempts, extra items in Today's focus, Keep an eye on these, and
  // Recent activity. "Continue learning" and "Coming up" have no backend
  // equivalent (no study-session tracking or scheduling routes), so they
  // stay demo-only.
  const [home, courseData, backendCourses] = await Promise.all([
    loadJSON('../data/mock/home.json'),
    loadJSON('../data/mock/courses.json'),
    typeof sabilearnGetBackendCourses === 'function' ? sabilearnGetBackendCourses() : Promise.resolve([]),
  ]);
  const healthCourses = courseData.courses.concat(
    backendCourses.map((c) => (typeof sabilearnBackendCourseToUi === 'function' ? sabilearnBackendCourseToUi(c) : {
      id: String(c.id), code: c.code || 'COURSE', title: c.name, progress: 0,
    }))
  );

  document.getElementById('home-date').textContent = formatToday();
  document.getElementById('home-greeting').textContent = `${timeGreeting()}, ${home.greetingName}.`;

  const backend = buildBackendHomeData(backendCourses);

  renderContinueLearning(home.continueLearning);
  renderComingUp(home.comingUp);
  renderFocus(backend.focus.concat(home.todaysFocus));
  renderCourseHealth(healthCourses);
  renderWeakAreas(backend.weakAreas.concat(home.weakAreas));
  renderActivity(backend.activity.concat(home.recentActivity));

  // ---- Quick Action (Screen 44) ----
  const fab = document.getElementById('quick-action-fab');
  const menu = document.getElementById('quick-action-menu');
  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    fab.classList.toggle('is-open');
    menu.classList.toggle('is-open');
  });
  document.addEventListener('click', () => { fab.classList.remove('is-open'); menu.classList.remove('is-open'); });
});
