// SABILEARN — Global Flashcards hub behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const { decks } = await loadJSON('../../data/mock/flashcards.json');
  const { courses } = await loadJSON('../../data/mock/courses.json');

  const dueDecks = decks.filter((d) => d.dueCount > 0);
  document.getElementById('needs-review').innerHTML = dueDecks.length ? dueDecks.map((d) => `
    <a href="flashcard-study.html?deck=${d.id}&course=${d.courseId}" class="card quiz-card-row" style="display:flex;">
      <div>
        <div class="quiz-card-row-title">${d.title}</div>
        <div class="quiz-card-row-meta">${d.courseCode} · ${d.totalCards} cards</div>
      </div>
      <span class="badge deck-due-badge">${d.dueCount} due</span>
    </a>
  `).join('') : `<p style="color:var(--color-text-faint); font-size:14px;">Nothing due right now — nice work.</p>`;

  document.getElementById('deck-grid').innerHTML = decks.map((d) => `
    <a href="deck-details.html?deck=${d.id}" class="card deck-card" style="display:block;">
      <span class="badge">${d.courseCode}</span>
      <h4>${d.title}</h4>
      <div class="deck-card-meta">${d.totalCards} cards ${d.dueCount ? `· ${d.dueCount} due` : ''}</div>
      <span class="card-link">View deck →</span>
    </a>
  `).join('');

  document.getElementById('course-chip-row').innerHTML = courses.map((c) => `
    <a href="../courses/course.html?course=${c.id}&tab=flashcards" class="course-chip">${c.code} · ${c.title}</a>
  `).join('');
});
