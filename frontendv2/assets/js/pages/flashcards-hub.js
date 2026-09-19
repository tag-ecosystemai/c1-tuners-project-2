// SABILEARN — Global Flashcards hub behavior
// Merges real backend courses (GET /courses/) and any flashcard decks
// actually generated from them (cached locally after POST /flashcards/ —
// see generated-content-store.js) with the mock/demo courses and decks,
// so the hub reflects real data once a backend course has decks, without
// losing the demo content for courses that don't have a backend yet.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

// Course + topic picker for "+ Create Deck", replacing the old prompt()
// based course chooser. Topic is a free-text field (optional) since the
// backend has no fixed topic list per course — POST /flashcards/ just
// takes whatever topic string is passed, or null for the whole course.
function openGenerateDeckModal(backendCourses) {
  return new Promise((resolve) => {
    let host = document.getElementById('generate-deck-modal');
    if (!host) {
      host = document.createElement('div');
      host.id = 'generate-deck-modal';
      host.className = 'modal-overlay';
      document.body.appendChild(host);
    }
    const options = backendCourses.map((c) => `<option value="${c.id}">${c.code ? `${c.code} · ` : ''}${c.name}</option>`).join('');
    host.innerHTML = `
      <div class="modal-card">
        <h3>Generate Flashcards</h3>
        <p class="sub">Choose a course, and optionally a topic to focus the deck on.</p>
        <div class="field">
          <label>Course</label>
          <select id="generate-deck-course-select" style="width:100%; padding:12px 14px; border:1px solid var(--color-border); border-radius:var(--radius-sm); background:var(--color-bg); font-size:14px;">${options}</select>
        </div>
        <div class="field">
          <label>Topic (optional)</label>
          <input type="text" id="generate-deck-topic-input" placeholder="Leave blank to cover the whole course" style="width:100%; padding:12px 14px; border:1px solid var(--color-border); border-radius:var(--radius-sm); background:var(--color-bg); font-size:14px;">
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="generate-deck-cancel">Cancel</button>
          <button class="btn btn-primary" id="generate-deck-confirm">Generate</button>
        </div>
      </div>
    `;
    host.classList.add('is-open');
    const close = (result) => { host.classList.remove('is-open'); resolve(result); };
    host.querySelector('#generate-deck-cancel').onclick = () => close(null);
    host.onclick = (e) => { if (e.target === host) close(null); };
    host.querySelector('#generate-deck-confirm').onclick = () => {
      const courseId = host.querySelector('#generate-deck-course-select').value;
      const topic = host.querySelector('#generate-deck-topic-input').value.trim();
      const course = backendCourses.find((c) => String(c.id) === String(courseId));
      if (!course) return;
      close({ course, topic: topic || null });
    };
  });
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const [{ decks: mockDecks }, { courses: mockCourses }, backendCourses] = await Promise.all([
    loadJSON('../../data/mock/flashcards.json'),
    loadJSON('../../data/mock/courses.json'),
    sabilearnGetBackendCourses(),
  ]);

  const generatedDecks = backendCourses.flatMap((c) => getGeneratedDecks(c.id));
  const decks = mockDecks.concat(generatedDecks);
  const courses = mockCourses.concat(backendCourses.map((c) => sabilearnBackendCourseToUi(c)));

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

  document.getElementById('deck-grid').innerHTML = decks.length ? decks.map((d) => `
    <a href="deck-details.html?deck=${d.id}&course=${d.courseId}" class="card deck-card" style="display:block;">
      <span class="badge">${d.courseCode}</span>
      <h4>${d.title}</h4>
      <div class="deck-card-meta">${d.totalCards} cards ${d.dueCount ? `· ${d.dueCount} due` : ''}</div>
      <span class="card-link">View deck →</span>
    </a>
  `).join('') : `<p style="color:var(--color-text-faint); grid-column:1/-1;">No decks yet. Generate flashcards from a course's materials to get started.</p>`;

  document.getElementById('course-chip-row').innerHTML = courses.map((c) => `
    <a href="../courses/course.html?course=${c.id}&tab=flashcards" class="course-chip">${c.code} · ${c.title}</a>
  `).join('');

  // "+ Create Deck" — generates a real deck from a real course's materials
  // via POST /flashcards/ when a backend course is picked; otherwise falls
  // back to the mock demo deck so the flow still works without a backend.
  document.getElementById('create-deck-btn')?.addEventListener('click', async () => {
    if (!backendCourses.length) {
      window.location.href = 'flashcard-study.html?deck=neural-networks-deck&course=csc301';
      return;
    }
    const picked = await openGenerateDeckModal(backendCourses);
    if (!picked) return;
    const { course, topic } = picked;
    const btn = document.getElementById('create-deck-btn');
    btn.textContent = 'Generating\u2026';
    btn.disabled = true;
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/flashcards/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: Number(course.id), topic, num_cards: 10 }),
      }, 60000);
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const backendFlashcards = await res.json();
      const deck = normalizeBackendFlashcards(backendFlashcards, {
        courseId: course.id,
        courseCode: course.code,
        courseTitle: course.name,
        topic,
      });
      if (!deck.cards.length) throw new Error('Backend returned no usable flashcards');
      saveGeneratedDeck(deck);
      window.location.href = `flashcard-study.html?deck=${deck.id}&course=${course.id}`;
    } catch (err) {
      console.warn('Sabilearn: flashcard generation backend call failed.', err);
      alert("We couldn't generate flashcards from the backend right now. Please try again.");
      btn.textContent = '+ Create Deck';
      btn.disabled = false;
    }
  });
});
