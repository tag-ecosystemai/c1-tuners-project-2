// SABILEARN — Progress screen behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const [progress, { courses }] = await Promise.all([
    loadJSON('../../data/mock/progress.json'),
    loadJSON('../../data/mock/courses.json'),
  ]);

  document.getElementById('stat-grid').innerHTML = `
    <div class="card stat-card"><div class="value">${progress.overall}%</div><div class="label">Overall Progress</div></div>
    <div class="card stat-card"><div class="value">${progress.streakDays}</div><div class="label">Day Streak</div></div>
    <div class="card stat-card"><div class="value">${progress.studyTimeThisWeek}</div><div class="label">Study Time This Week</div></div>
    <div class="card stat-card"><div class="value">${progress.quizzesTaken}</div><div class="label">Quizzes Taken</div></div>
  `;

  document.getElementById('course-progress-list').innerHTML = courses.map((c) => `
    <div class="progress-row">
      <div class="progress-row-body">
        <div class="progress-row-top"><span>${c.code} · ${c.title}</span><span>${c.progress}%</span></div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${c.progress}%"></div></div>
      </div>
    </div>
  `).join('');

  const allTopics = courses.flatMap((c) => c.topics.map((t) => ({ ...t, course: c.code, courseId: c.id })));
  allTopics.sort((a, b) => a.mastery - b.mastery);
  document.getElementById('topic-mastery-list').innerHTML = allTopics.map((t) => `
    <a href="topic-details.html?course=${t.courseId}&topic=${encodeURIComponent(t.name)}" class="topic-mastery-row" style="text-decoration:none; color:inherit;">
      <span>${t.name} <span style="color:var(--color-text-faint); font-size:12px;">· ${t.course}</span></span>
      <div class="topic-mastery-track"><div class="topic-mastery-fill" style="width:${t.mastery}%"></div></div>
      <span>${t.mastery}%</span>
    </a>
  `).join('');

  document.getElementById('insights-list').innerHTML = progress.insights.map((text) => `
    <div class="insight-item"><span class="mark">✦</span><span>${text}</span></div>
  `).join('');
});
