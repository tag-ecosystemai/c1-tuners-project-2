// SABILEARN — Flashcard Deck Details behavior
// Backend-generated decks (id starting with "backend-deck-", created via
// POST /flashcards/ — see course.js generateFlashcardsForCourse and
// generated-content-store.js) are loaded from the local cache. Mock/demo
// decks keep using data/mock/flashcards.json exactly as before. "Generate
// More Cards" calls the real backend for a backend deck; for a mock deck
// it explains that a real course is required, since there's nothing to
// call for a demo deck.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const deckId = params.get('deck') || 'neural-networks-deck';

  let deck = getGeneratedDeckById(deckId);
  const isGenerated = !!deck;
  if (!deck) {
    const data = await loadJSON('../../data/mock/flashcards.json');
    deck = data.decks.find((d) => d.id === deckId);
  }
  if (!deck) {
    // Not a demo deck and no saved backend deck with this id — don't swap
    // in some other deck.
    sabilearnRenderPageError(document.querySelector('.page-content'), {
      title: "We couldn't find this deck",
      message: 'Generated decks are saved in this browser only. Generate it again to view it.',
      onRetry: () => window.location.reload(),
      backHref: 'flashcards.html',
      backLabel: 'Back to Flashcards',
    });
    return;
  }

  document.getElementById('deck-title').textContent = deck.title;
  document.getElementById('deck-course').textContent = deck.courseCode;
  document.getElementById('deck-total').textContent = deck.totalCards;
  document.getElementById('deck-due').textContent = deck.dueCount;
  document.getElementById('deck-last-reviewed').textContent = deck.lastReviewed;
  document.getElementById('deck-progress-fill').style.width = `${deck.progress}%`;
  document.getElementById('deck-progress-label').textContent = `${deck.progress}%`;

  document.getElementById('study-now-btn').href = `flashcard-study.html?deck=${deck.id}&course=${deck.courseId}`;

  function persistIfGenerated() {
    if (isGenerated) updateGeneratedDeck(deck);
  }

  function renderCards() {
    document.getElementById('card-list').innerHTML = deck.cards.map((c, i) => `
      <div class="card list-item-card" data-index="${i}">
        <div class="list-item-title" style="font-size:14px;">${c.q}</div>
        <div style="display:flex; gap:8px;">
          <button class="material-menu-btn" data-edit="${i}">Edit</button>
          <button class="material-menu-btn" data-remove="${i}" style="color:var(--color-warn-text);">Remove</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await sabilearnDialog({ title: 'Remove this card?', body: 'This card will be removed from the deck.', confirmLabel: 'Remove', danger: true, icon: '\u26A0' });
        if (ok) {
          deck.cards.splice(Number(btn.dataset.remove), 1);
          deck.totalCards = deck.cards.length;
          document.getElementById('deck-total').textContent = deck.totalCards;
          persistIfGenerated();
          renderCards();
        }
      });
    });
    document.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = deck.cards[Number(btn.dataset.edit)];
        const newQ = prompt('Edit question:', card.q);
        if (newQ) {
          card.q = newQ;
          persistIfGenerated();
          renderCards();
        }
      });
    });
  }
  renderCards();

  document.getElementById('add-card-btn').addEventListener('click', () => {
    const q = prompt('New card — question:');
    if (!q) return;
    const a = prompt('New card — answer:') || '';
    deck.cards.push({ q, a });
    deck.totalCards += 1;
    deck.dueCount += 1;
    document.getElementById('deck-total').textContent = deck.totalCards;
    document.getElementById('deck-due').textContent = deck.dueCount;
    persistIfGenerated();
    renderCards();
  });

  document.getElementById('generate-more-btn').addEventListener('click', async () => {
    const btn = document.getElementById('generate-more-btn');
    const isRealCourse = typeof isBackendId === 'function' && isBackendId(deck.courseId);
    if (!isRealCourse) {
      alert('Generating more cards requires a real course connected to the backend.');
      return;
    }
    btn.textContent = 'Generating\u2026';
    btn.disabled = true;
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/flashcards/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: Number(deck.courseId), topic: deck.topic || null, num_cards: 5 }),
      }, 60000);
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const backendFlashcards = await res.json();
      const generated = normalizeBackendFlashcards(backendFlashcards, {
        courseId: deck.courseId,
        courseCode: deck.courseCode,
        topic: deck.topic,
      });
      if (!generated.cards.length) throw new Error('Backend returned no usable flashcards');
      deck.cards = deck.cards.concat(generated.cards);
      deck.totalCards = deck.cards.length;
      deck.dueCount += generated.cards.length;
      document.getElementById('deck-total').textContent = deck.totalCards;
      document.getElementById('deck-due').textContent = deck.dueCount;
      persistIfGenerated();
      renderCards();
      alert(`${generated.cards.length} new cards generated from your course materials.`);
    } catch (err) {
      console.warn('Sabilearn: flashcard generation backend call failed.', err);
      alert("We couldn't generate more cards from the backend right now. Please try again.");
    } finally {
      btn.textContent = '\u2726 Generate More Cards';
      btn.disabled = false;
    }
  });
});
