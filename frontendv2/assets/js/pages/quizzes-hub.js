// SABILEARN — Global Quizzes hub behavior
// Merges real backend courses (GET /courses/), quizzes actually generated
// from them (POST /quiz/, cached locally — see generated-content-store.js)
// and real completed attempts (recorded by quiz-taking.html) with the
// mock/demo quizzes and history, so the hub is real wherever the backend
// has been used, without losing the demo content otherwise. There is no
// backend concept of an "in-progress" quiz (partway through, not
// finished), so that section stays mock-only.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const [{ quizzes: mockQuizzes, history: mockHistory }, { courses: mockCourses }, backendCourses] = await Promise.all([
    loadJSON('../../data/mock/quizzes.json'),
    loadJSON('../../data/mock/courses.json'),
    sabilearnGetBackendCourses(),
  ]);

  const generatedQuizzes = backendCourses.flatMap((c) => getGeneratedQuizzes(c.id));
  const quizzes = mockQuizzes.concat(generatedQuizzes);

  // Real attempts are stored most-recent-first; number them 1..N per quiz
  // in chronological order so "Attempt 1/2/3" reads naturally.
  const realHistoryChrono = getQuizHistory().slice().reverse();
  const attemptCounters = {};
  const realHistory = realHistoryChrono.map((h) => {
    attemptCounters[h.quizId] = (attemptCounters[h.quizId] || 0) + 1;
    return { ...h, attempt: attemptCounters[h.quizId] };
  });
  const history = mockHistory.concat(realHistory);
  const courses = mockCourses.concat(backendCourses.map((c) => sabilearnBackendCourseToUi(c)));

  const quizLookup = Object.fromEntries(quizzes.map((q) => [q.id, q]));

  const inProgress = mockHistory.filter((h) => h.status === 'in-progress');
  const completed = history.filter((h) => h.status === 'completed');

  // Group completed attempts by quiz for the Recent section (show latest per quiz)
  const latestByQuiz = {};
  completed.forEach((h) => {
    if (!latestByQuiz[h.quizId] || (h.attempt || 1) > (latestByQuiz[h.quizId].attempt || 1)) latestByQuiz[h.quizId] = h;
  });
  const recentList = Object.values(latestByQuiz);

  const continueWrap = document.getElementById('continue-quizzes');
  continueWrap.innerHTML = inProgress.length ? inProgress.map((h) => {
    const quiz = quizLookup[h.quizId];
    return `
      <a href="quiz-taking.html?quiz=${h.quizId}&course=${quiz.courseId}" class="card quiz-card-row" style="display:flex;">
        <div>
          <div class="quiz-card-row-title">${quiz.title}</div>
          <div class="quiz-card-row-meta">${quiz.courseCode} · Question ${h.answered + 1} of ${h.total}</div>
        </div>
        <span class="card-link">Continue →</span>
      </a>
    `;
  }).join('') : `<p style="color:var(--color-text-faint); font-size:14px;">No quizzes in progress.</p>`;

  const recentWrap = document.getElementById('recent-quizzes');
  recentWrap.innerHTML = recentList.length ? recentList.map((h) => {
    const title = h.title || quizLookup[h.quizId]?.title;
    const courseCode = h.courseCode || quizLookup[h.quizId]?.courseCode;
    const courseId = h.courseId || quizLookup[h.quizId]?.courseId;
    return `
      <a href="quiz-taking.html?quiz=${h.quizId}&course=${courseId}" class="card quiz-card-row" style="display:flex;">
        <div>
          <div class="quiz-card-row-title">${title}</div>
          <div class="quiz-card-row-meta">${courseCode} · ${h.date}</div>
        </div>
        <span class="quiz-score-pill">${h.score}/${h.total}</span>
      </a>
    `;
  }).join('') : `<p style="color:var(--color-text-faint); font-size:14px;">No quizzes taken yet.</p>`;

  // ---- Quiz History (with multi-attempt tracking) ----
  const byQuiz = {};
  completed.forEach((h) => { (byQuiz[h.quizId] = byQuiz[h.quizId] || []).push(h); });

  const historyWrap = document.getElementById('quiz-history');
  historyWrap.innerHTML = Object.entries(byQuiz).map(([quizId, attempts]) => {
    const quiz = quizLookup[quizId];
    attempts.sort((a, b) => (a.attempt || 1) - (b.attempt || 1));
    const pcts = attempts.map((a) => Math.round((a.score / a.total) * 100));
    let insight = '';
    if (attempts.length > 1) {
      const improving = pcts[pcts.length - 1] > pcts[0];
      insight = improving
        ? `You're improving on this topic. Your accuracy increased across your last ${attempts.length} attempts.`
        : `You may need another review of this topic before attempting another quiz.`;
    }
    return `
      <div class="card" style="margin-bottom:12px; padding:18px 20px;">
        <div class="quiz-card-row-title">${quiz?.title || attempts[0].title}</div>
        <div class="quiz-card-row-meta" style="margin-bottom:10px;">${quiz?.courseCode || attempts[0].courseCode}</div>
        ${attempts.map((a, i) => `<div style="font-size:13px; color:var(--color-text-muted);">Attempt ${a.attempt || i + 1} — ${pcts[i]}% · ${a.date}</div>`).join('')}
        ${insight ? `<p style="font-size:13px; color:var(--color-primary); margin-top:10px;">✦ ${insight}</p>` : ''}
        <a href="quiz-taking.html?quiz=${quizId}&course=${quiz?.courseId || attempts[0].courseId}" class="card-link" style="display:inline-block; margin-top:10px;">Review →</a>
      </div>
    `;
  }).join('') || `<p style="color:var(--color-text-faint);">No completed quizzes yet.</p>`;

  document.getElementById('toggle-history-link').addEventListener('click', (e) => {
    e.preventDefault();
    const el = document.getElementById('quiz-history');
    const isOpen = el.style.display !== 'none';
    el.style.display = isOpen ? 'none' : 'block';
    e.target.textContent = isOpen ? 'View all →' : 'Hide';
  });

  document.getElementById('course-chip-row').innerHTML = courses.map((c) => `
    <a href="../courses/course.html?course=${c.id}&tab=quizzes" class="course-chip">${c.code} · ${c.title}</a>
  `).join('');
});
