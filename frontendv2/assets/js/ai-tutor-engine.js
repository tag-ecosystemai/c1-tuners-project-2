// SABILEARN — AI Tutor engine
// Wired to POST /ask/ on the backend (backend/app/routes/ask.py) whenever
// the calling page hands us a real backend course id. Falls back to the
// canned mock responses below for mock/demo courses, or if the backend
// call fails (e.g. it isn't running).

const AI_TUTOR_RESPONSES = {
  backpropagation: {
    explanation: "Backpropagation is how a neural network learns from its mistakes. It checks how much each connection contributed to the final error, then adjusts those connections so the next prediction is better.",
    analogy: "It's like adjusting the dials on a radio: each small adjustment makes the signal clearer.",
    example: "If a model labels a cat as a dog, backpropagation helps identify which connections led to that mistake and nudges them in a better direction.",
    source: "Based on Lecture 04 — Neural Networks",
  },
  default: {
    explanation: "Here's a useful way to think about \u201c{{Q}}\u201d: start with what you already know, compare it with the expected idea, and work backward to see where the gap is. That's usually where the real understanding happens.",
    analogy: "Think of it like retracing your steps to find where you took a wrong turn.",
    example: "Try applying this to a problem from your own course materials — the AI Tutor grounds its answers in what you've uploaded, so the more specific your question, the better the example it can give.",
    source: "Based on your uploaded course materials",
  },
};

function matchResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('backprop')) return AI_TUTOR_RESPONSES.backpropagation;
  const fallback = { ...AI_TUTOR_RESPONSES.default };
  fallback.explanation = fallback.explanation.replace('{{Q}}', query);
  return fallback;
}

async function getTutorResponse(courseId, query) {
  if (typeof isBackendId === 'function' && isBackendId(courseId)) {
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/ask/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, course_id: Number(courseId) }),
      });
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      return {
        explanation: data.answer,
        analogy: '',
        example: '',
        source: 'Answered by the Sabilearn backend',
      };
    } catch (err) {
      console.warn('Sabilearn: AI Tutor backend call failed, using mock response.', err);
    }
  }
  return matchResponse(query);
}

function renderTutorMessage(container, response, isUser) {
  const el = document.createElement('div');
  if (isUser) {
    el.className = 'tutor-msg-user';
    el.textContent = response;
  } else {
    el.className = 'tutor-msg-ai';
    el.innerHTML = `
      <div class="tutor-msg-label">✦ Sabilearn tutor</div>
      <div class="tutor-response-card">
        <div class="tutor-response-label">Explanation</div>
        <p>${response.explanation}</p>
        ${response.analogy ? `
        <div class="tutor-analogy-box">
          <div class="tutor-response-label">Simple analogy</div>
          <p>${response.analogy}</p>
        </div>` : ''}
        ${response.example ? `
        <div class="tutor-response-label" style="margin-top:14px;">Example</div>
        <p>${response.example}</p>` : ''}
        <div class="tutor-source-chip">📖 ${response.source}</div>
      </div>
      <div class="tutor-quick-actions">
        <button class="quick-chip" data-action="simpler">Explain simpler</button>
        <button class="quick-chip" data-action="example">Give me an example</button>
        <button class="quick-chip" data-action="quiz">Quiz me</button>
        <button class="quick-chip" data-action="flashcards">Create flashcards</button>
        <button class="quick-chip" data-action="deeper">Go deeper</button>
      </div>
    `;
  }
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function initAiTutor(root, { courseId, courseCode, courseTitle, quizLink, flashcardLink }) {
  root.innerHTML = `
    <div class="tutor-card">
      <div class="tutor-card-header">
        <span class="badge">Course-grounded tutor</span>
        <h3>${courseCode} AI Tutor</h3>
        <p>Ask questions about your course materials.</p>
      </div>
      <div class="tutor-thread" id="tutor-thread"></div>
      <form class="tutor-input-row" id="tutor-form">
        <input type="text" id="tutor-input" placeholder="Ask anything about this course..." autocomplete="off">
        <button type="submit" class="tutor-send-btn" aria-label="Send">➤</button>
      </form>
      <p class="tutor-input-note">Answers are grounded in your uploaded course materials.</p>
    </div>
  `;

  const thread = root.querySelector('#tutor-thread');
  const isRealCourse = typeof isBackendId === 'function' && isBackendId(courseId);
  // Only seed the canned backpropagation demo message for mock/demo courses;
  // a real backend course starts with a clean thread.
  if (!isRealCourse) {
    renderTutorMessage(thread, matchResponse('backpropagation'), false);
  }

  root.querySelector('#tutor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = root.querySelector('#tutor-input');
    const value = input.value.trim();
    if (!value) return;
    renderTutorMessage(thread, value, true);
    input.value = '';
    const response = await getTutorResponse(courseId, value);
    renderTutorMessage(thread, response, false);
  });

  thread.addEventListener('click', async (e) => {
    const btn = e.target.closest('.quick-chip');
    if (!btn) return;
    if (btn.dataset.action === 'quiz' && quizLink) { window.location.href = quizLink; return; }
    if (btn.dataset.action === 'flashcards' && flashcardLink) { window.location.href = flashcardLink; return; }
    const labelMap = { simpler: 'Explain that more simply', example: 'Give me another example', deeper: 'Go deeper on this' };
    const label = labelMap[btn.dataset.action] || 'Tell me more';
    renderTutorMessage(thread, label, true);
    const response = await getTutorResponse(courseId, label);
    renderTutorMessage(thread, response, false);
  });
}
