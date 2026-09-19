// SABILEARN — Search Results behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function section(title, items) {
  if (!items.length) return '';
  return `
    <div class="home-section-title"><h3>${title}</h3></div>
    <div style="margin-bottom:24px;">${items.join('')}</div>
  `;
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';
  document.getElementById('search-query-text').textContent = query;
  document.getElementById('search-input-field').value = query;

  const [{ courses }, materialsData, quizData, flashcardData] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    loadJSON('../../data/mock/materials.json'),
    loadJSON('../../data/mock/quizzes.json'),
    loadJSON('../../data/mock/flashcards.json'),
  ]);

  const q = query.toLowerCase();
  const matches = (s) => q && s.toLowerCase().includes(q);

  const courseMatches = courses.filter((c) => matches(c.title) || matches(c.code));
  const topicMatches = courses.flatMap((c) => c.topics.filter((t) => matches(t.name)).map((t) => ({ ...t, course: c })));
  const materialMatches = Object.entries(materialsData).flatMap(([cid, items]) =>
    items.filter((m) => matches(m.title)).map((m) => ({ ...m, courseId: cid, course: courses.find((c) => c.id === cid) })));
  const quizMatches = quizData.quizzes.filter((qz) => matches(qz.title) || matches(qz.topic));
  const deckMatches = flashcardData.decks.filter((d) => matches(d.title));

  const resultsWrap = document.getElementById('search-results');
  const totalResults = courseMatches.length + topicMatches.length + materialMatches.length + quizMatches.length + deckMatches.length;

  if (!query) {
    resultsWrap.innerHTML = `<p style="color:var(--color-text-faint);">Type something above to search your learning space.</p>`;
  } else if (totalResults === 0) {
    resultsWrap.innerHTML = `
      <div class="page-empty-state">
        <div class="icon">🔍</div>
        <h3>No results for "${query}"</h3>
        <p>Try a different search term, or ask the AI Tutor directly.</p>
      </div>
    `;
  } else {
    resultsWrap.innerHTML =
      section('Courses', courseMatches.map((c) => `
        <a href="../courses/course.html?course=${c.id}" class="card list-item-card" style="display:flex;">
          <div><div class="list-item-title">${c.title}</div><div class="list-item-meta">${c.code}</div></div>
          <span class="card-link">Open →</span>
        </a>
      `)) +
      section('Materials', materialMatches.map((m) => `
        <a href="../library/material-viewer.html?material=${m.id}&course=${m.courseId}" class="card list-item-card" style="display:flex;">
          <div><div class="list-item-title">${m.title}</div><div class="list-item-meta">${m.course?.code}</div></div>
          <span class="card-link">Open →</span>
        </a>
      `)) +
      section('Topics', topicMatches.map((t) => `
        <a href="../progress/topic-details.html?course=${t.course.id}&topic=${encodeURIComponent(t.name)}" class="card list-item-card" style="display:flex;">
          <div><div class="list-item-title">${t.name}</div><div class="list-item-meta">${t.course.code} · ${t.mastery}% mastery</div></div>
          <span class="card-link">View →</span>
        </a>
      `)) +
      section('Quizzes', quizMatches.map((qz) => `
        <a href="../quizzes/quiz-taking.html?quiz=${qz.id}&course=${qz.courseId}" class="card list-item-card" style="display:flex;">
          <div><div class="list-item-title">${qz.title}</div><div class="list-item-meta">${qz.courseCode}</div></div>
          <span class="card-link">Take →</span>
        </a>
      `)) +
      section('Flashcards', deckMatches.map((d) => `
        <a href="../flashcards/flashcard-study.html?deck=${d.id}&course=${d.courseId}" class="card list-item-card" style="display:flex;">
          <div><div class="list-item-title">${d.title}</div><div class="list-item-meta">${d.courseCode}</div></div>
          <span class="card-link">Study →</span>
        </a>
      `));
  }

  document.getElementById('ask-ai-btn').textContent = `Ask AI about "${query}"`;
  document.getElementById('ask-ai-btn').addEventListener('click', () => {
    window.location.href = `../study/study-session.html?topic=${encodeURIComponent(query)}`;
  });
});
