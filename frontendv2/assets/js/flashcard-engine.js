// SABILEARN — Flashcard study engine
// TODO: replace the mocked scheduling below with POST /flashcards/:cardId/review
// { rating } once the backend's spaced-repetition logic exists.

function initFlashcardStudy(root, deck, { backLabel, backHref }) {
  const state = { index: 0, revealed: false };
  const total = deck.cards.length;

  function renderShell() {
    root.innerHTML = `
      <a href="${backHref}" class="back-link">← ${backLabel}</a>
      <div class="flashcard-header">
        <span class="badge">${deck.courseCode} · Flashcards</span>
        <h1>Build your recall</h1>
        <p>Tap the card to reveal the answer, then rate how well you knew it.</p>
      </div>
      <div class="flashcard-progress-row">
        <span id="fc-count"></span>
        <span id="fc-pct"></span>
      </div>
      <div class="quiz-progress-track"><div class="quiz-progress-fill" id="fc-progress-fill"></div></div>
      <div id="fc-area"></div>
    `;
  }

  function renderCard() {
    state.revealed = false;
    const card = deck.cards[state.index];
    document.getElementById('fc-count').textContent = `Card ${state.index + 1} of ${total}`;
    document.getElementById('fc-pct').textContent = `${Math.round((state.index / total) * 100)}% session progress`;
    document.getElementById('fc-progress-fill').style.width = `${(state.index / total) * 100}%`;

    const area = document.getElementById('fc-area');
    area.innerHTML = `
      <div class="flashcard-face" id="flashcard-face">
        <div class="flashcard-mark">✦</div>
        <div class="flashcard-kind" id="flashcard-kind">QUESTION</div>
        <h2 id="flashcard-text">${card.q}</h2>
        <p class="flashcard-hint" id="flashcard-hint">Click to flip</p>
      </div>
      <div class="flashcard-ratings" id="flashcard-ratings" style="visibility:hidden;">
        <button class="rating-btn rating-again" data-rating="again">Again</button>
        <button class="rating-btn rating-hard" data-rating="hard">Hard</button>
        <button class="rating-btn rating-good" data-rating="good">Good</button>
        <button class="rating-btn rating-easy" data-rating="easy">Easy</button>
      </div>
      <div style="text-align:center; margin-top:18px;">
        <button class="btn btn-secondary btn-sm" id="fc-restart">↺ Restart session</button>
      </div>
    `;

    document.getElementById('flashcard-face').addEventListener('click', () => {
      if (state.revealed) return;
      state.revealed = true;
      document.getElementById('flashcard-face').classList.add('is-answer');
      document.getElementById('flashcard-kind').textContent = 'ANSWER';
      document.getElementById('flashcard-text').textContent = card.a;
      document.getElementById('flashcard-hint').textContent = '';
      document.getElementById('flashcard-ratings').style.visibility = 'visible';
    });

    area.querySelectorAll('.rating-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // TODO: send { cardId: card.id, rating: btn.dataset.rating } to the backend
        state.index += 1;
        if (state.index >= total) {
          renderComplete();
        } else {
          renderCard();
        }
      });
    });

    document.getElementById('fc-restart').addEventListener('click', (e) => {
      e.stopPropagation();
      state.index = 0;
      renderCard();
    });
  }

  function renderComplete() {
    document.getElementById('fc-progress-fill').style.width = '100%';
    document.getElementById('fc-count').textContent = `Card ${total} of ${total}`;
    document.getElementById('fc-pct').textContent = `100% session progress`;
    document.getElementById('fc-area').innerHTML = `
      <div class="card quiz-results-card">
        <div class="quiz-results-score">✓</div>
        <p class="quiz-results-pct">You reviewed all ${total} cards in this deck.</p>
        <div class="quiz-results-actions">
          <a href="${backHref}" class="btn btn-secondary">${backLabel}</a>
          <button class="btn btn-primary" id="fc-review-again">Review Again</button>
        </div>
      </div>
    `;
    document.getElementById('fc-review-again').addEventListener('click', () => {
      state.index = 0;
      renderCard();
    });
  }

  renderShell();
  renderCard();
}
