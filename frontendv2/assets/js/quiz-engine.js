// SABILEARN — Quiz engine (mocked scoring/evaluation; TODO: replace client-side
// grading with POST /quizzes/:id/submit once the backend exists)

function initQuizTaking(root, quiz, { backLabel, backHref, onFinish }) {
  const state = { index: 0, score: 0, answers: [], locked: false };
  const total = quiz.questions.length;

  function renderShell() {
    root.innerHTML = `
      <a href="${backHref}" class="back-link">← ${backLabel}</a>
      <div class="quiz-taking-header">
        <div>
          <span class="badge">${quiz.courseCode}</span>
          <h1>${quiz.title}</h1>
          <p class="quiz-question-count" id="quiz-question-count"></p>
        </div>
        <div class="running-score-box">
          <div class="label">Running score</div>
          <div class="value" id="running-score">0/${total}</div>
        </div>
      </div>
      <div class="quiz-progress-track"><div class="quiz-progress-fill" id="quiz-progress-fill"></div></div>
      <div id="quiz-question-area"></div>
    `;
  }

  function renderQuestion() {
    state.locked = false;
    const q = quiz.questions[state.index];
    document.getElementById('quiz-question-count').textContent = `Question ${state.index + 1} of ${total}`;
    document.getElementById('quiz-progress-fill').style.width = `${(state.index / total) * 100}%`;

    const area = document.getElementById('quiz-question-area');
    area.innerHTML = `
      <div class="card quiz-question-card">
        <h3>${q.q}</h3>
        <div class="quiz-options" id="quiz-options">
          ${q.options.map((opt, i) => `<button class="quiz-option" data-i="${i}"><span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span> ${opt}</button>`).join('')}
        </div>
        <div class="quiz-actions">
          <button class="btn btn-primary" id="quiz-submit-btn" disabled>Submit Answer</button>
        </div>
        <div class="quiz-feedback" id="quiz-feedback" style="display:none;"></div>
      </div>
    `;

    let selected = null;
    area.querySelectorAll('.quiz-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.locked) return;
        area.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selected = Number(btn.dataset.i);
        document.getElementById('quiz-submit-btn').disabled = false;
      });
    });

    document.getElementById('quiz-submit-btn').addEventListener('click', () => {
      if (selected === null || state.locked) return;
      state.locked = true;
      const correct = selected === q.correct;
      if (correct) state.score += 1;
      state.answers.push({ selected, correct });
      document.getElementById('running-score').textContent = `${state.score}/${total}`;

      area.querySelectorAll('.quiz-option').forEach((b, i) => {
        b.disabled = true;
        if (i === q.correct) b.classList.add('is-correct');
        else if (i === selected) b.classList.add('is-incorrect');
      });

      const feedback = document.getElementById('quiz-feedback');
      feedback.style.display = 'block';
      feedback.className = `quiz-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
      feedback.innerHTML = `
        <strong>${correct ? 'Nice — that\u2019s right' : 'Not quite — keep going'}</strong>
        <button class="why-toggle" type="button">Why? ⌄</button>
        <p class="why-text" style="display:none;">${q.why}</p>
      `;
      feedback.querySelector('.why-toggle').addEventListener('click', () => {
        const t = feedback.querySelector('.why-text');
        t.style.display = t.style.display === 'none' ? 'block' : 'none';
      });

      const actions = area.querySelector('.quiz-actions');
      actions.innerHTML = `<button class="btn btn-primary" id="quiz-next-btn">${state.index + 1 === total ? 'See Results →' : 'Next Question →'}</button>`;
      document.getElementById('quiz-next-btn').addEventListener('click', () => {
        state.index += 1;
        if (state.index >= total) {
          renderResults();
        } else {
          renderQuestion();
        }
      });
    });
  }

  function renderResults() {
    document.getElementById('quiz-progress-fill').style.width = '100%';
    const pct = Math.round((state.score / total) * 100);
    const missed = quiz.questions.filter((q, i) => !state.answers[i].correct);
    const weakEnough = pct < 80;
    // The backend has no per-topic mastery analysis today, so the canned
    // "AI Insight" / "You did well in" / "Room to improve" copy below is
    // fabricated, not a real read of the learner's performance. Only show
    // it for mock/demo quizzes; backend quizzes show the real score and
    // real missed questions and nothing invented on top of them.
    const isBackendQuiz = quiz.source === 'backend';

    document.getElementById('quiz-question-area').innerHTML = `
      <div class="card quiz-results-card">
        <div class="quiz-results-score">${state.score}/${total}</div>
        <p class="quiz-results-pct">${pct}% correct</p>

        ${isBackendQuiz ? '' : `
        <div class="quiz-results-section">
          <h4>AI Insight</h4>
          <p style="font-size:14px; color:var(--color-text-muted);">
            ${weakEnough
              ? `You have a good grasp of the basics, but ${quiz.topic} needs more practice — that's where most of the missed questions came from.`
              : `Strong performance on ${quiz.topic}. Your answers show a solid, consistent understanding of this topic.`}
          </p>
        </div>

        <div class="quiz-results-section" style="display:flex; gap:24px;">
          <div style="flex:1;">
            <h4>You did well in</h4>
            <p style="font-size:13.5px; color:var(--color-text-muted);">${weakEnough ? 'Core terminology and basic concepts' : quiz.topic}</p>
          </div>
          <div style="flex:1;">
            <h4>Room to improve</h4>
            <p style="font-size:13.5px; color:var(--color-text-muted);">${weakEnough ? quiz.topic : 'Nothing major — keep practicing to maintain this'}</p>
          </div>
        </div>
        `}

        ${missed.length ? `
          <div class="quiz-results-section">
            <h4>Review mistakes</h4>
            ${missed.map((q) => `<div class="quiz-mistake-row"><strong>${q.q}</strong><p>${q.why}</p></div>`).join('')}
          </div>
        ` : `<p class="quiz-results-perfect">Perfect score — great work on ${quiz.topic}.</p>`}

        ${(weakEnough && !isBackendQuiz) ? `
          <div class="recommended-card" style="text-align:left;">
            <span class="eyebrow">✦ Recommended for you</span>
            <h4 style="margin-top:10px;">Review ${quiz.topic}</h4>
            <p>You missed ${missed.length} question${missed.length === 1 ? '' : 's'} related to this topic.</p>
            <a href="../study/study-session.html?course=${quiz.courseId}" class="btn btn-primary btn-sm">Study Topic</a>
          </div>
        ` : ''}

        <div class="quiz-results-actions" style="flex-wrap:wrap;">
          <a href="${backHref}" class="btn btn-secondary">${backLabel}</a>
          <button class="btn btn-primary" id="quiz-retake-btn">Retake Quiz</button>
          <a href="../progress/progress.html" class="btn btn-secondary">View Progress</a>
        </div>
      </div>
    `;
    document.getElementById('quiz-retake-btn').addEventListener('click', () => {
      state.index = 0; state.score = 0; state.answers = [];
      document.getElementById('running-score').textContent = `0/${total}`;
      renderQuestion();
    });
    onFinish?.(state.score, total);
  }

  renderShell();
  renderQuestion();
}
