// SABILEARN — Flashcard Deck Details behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const deckId = params.get('deck') || 'neural-networks-deck';

  const data = await loadJSON('../../data/mock/flashcards.json');
  const deck = data.decks.find((d) => d.id === deckId) || data.decks[0];

  document.getElementById('deck-title').textContent = deck.title;
  document.getElementById('deck-course').textContent = deck.courseCode;
  document.getElementById('deck-total').textContent = deck.totalCards;
  document.getElementById('deck-due').textContent = deck.dueCount;
  document.getElementById('deck-last-reviewed').textContent = deck.lastReviewed;
  document.getElementById('deck-progress-fill').style.width = `${deck.progress}%`;
  document.getElementById('deck-progress-label').textContent = `${deck.progress}%`;

  document.getElementById('study-now-btn').href = `flashcard-study.html?deck=${deck.id}&course=${deck.courseId}`;

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
        if (ok) { deck.cards.splice(Number(btn.dataset.remove), 1); renderCards(); }
      });
    });
    document.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const card = deck.cards[Number(btn.dataset.edit)];
        const newQ = prompt('Edit question:', card.q);
        if (newQ) { card.q = newQ; renderCards(); }
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
    document.getElementById('deck-total').textContent = deck.totalCards;
    renderCards();
  });

  document.getElementById('generate-more-btn').addEventListener('click', () => {
    const btn = document.getElementById('generate-more-btn');
    btn.textContent = 'Generating\u2026';
    btn.disabled = true;
    // TODO: POST /flashcards/decks/:id/generate — AI generates more cards from the same course/material context
    setTimeout(() => {
      btn.textContent = '\u2726 Generate More Cards';
      btn.disabled = false;
      alert('5 new cards generated from your course materials.');
    }, 900);
  });
});
