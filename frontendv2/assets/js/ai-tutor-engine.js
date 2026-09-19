// SABILEARN — AI Tutor engine
// Wired to POST /ask/ on the backend (backend/app/routes/ask.py) whenever
// the calling page hands us a real backend course id:
//   { question, course_id, chat_history }
// Conversation history is kept client-side for the lifetime of the tutor
// pane and sent on every turn so the backend can resolve follow-up
// questions. Falls back to the canned mock responses below for mock/demo
// courses. For real backend courses, a failed call surfaces a retryable
// error bubble instead of silently swapping in a mock answer, so loading,
// success and error states are all visibly distinct.

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

// Calls the real backend. Throws on any non-OK response or network/timeout
// failure so the caller can show a proper error state instead of silently
// swapping in a mock answer.
async function fetchBackendTutorAnswer(courseId, query, chatHistory) {
  const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/ask/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: query,
      course_id: Number(courseId),
      chat_history: chatHistory,
    }),
  });
  if (!res.ok) throw new Error(`Backend responded ${res.status}`);
  const data = await res.json();
  return {
    explanation: answerToText(data.answer),
    analogy: '',
    example: '',
    // Only what the backend actually sent. /ask/ doesn't return a source
    // today, so no chip is shown until it does.
    source: extractSource(data),
  };
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
        <div class="tutor-markdown">${renderMarkdown(response.explanation)}</div>
        ${response.analogy ? `
        <div class="tutor-analogy-box">
          <div class="tutor-response-label">Simple analogy</div>
          <div class="tutor-markdown">${renderMarkdown(response.analogy)}</div>
        </div>` : ''}
        ${response.example ? `
        <div class="tutor-response-label" style="margin-top:14px;">Example</div>
        <div class="tutor-markdown">${renderMarkdown(response.example)}</div>` : ''}
        ${response.source ? `<div class="tutor-source-chip">📖 ${sabilearnEscapeHtml(response.source)}</div>` : ''}
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
  const input = root.querySelector('#tutor-input');
  const sendBtn = root.querySelector('.tutor-send-btn');
  const isRealCourse = typeof isBackendId === 'function' && isBackendId(courseId);

  // Conversation history for this tutor session, sent to the backend on
  // every turn ({ role: 'user' | 'assistant', content }) so it can resolve
  // follow-up questions ("what about the second one?" etc).
  let chatHistory = [];

  // Only seed the canned backpropagation demo message for mock/demo courses;
  // a real backend course starts with a clean thread.
  if (!isRealCourse) {
    renderTutorMessage(thread, matchResponse('backpropagation'), false);
  }

  function setBusy(busy) {
    input.disabled = busy;
    sendBtn.disabled = busy;
  }

  // Renders the user's message once, then sends it. Retry calls send()
  // directly so the question isn't shown twice.
  function ask(value) {
    renderTutorMessage(thread, value, true);
    send(value);
  }

  async function send(value) {
    setBusy(true);
    const loadingEl = renderChatLoading(thread, 'Sabilearn tutor is thinking');

    if (isRealCourse) {
      try {
        const response = await fetchBackendTutorAnswer(courseId, value, chatHistory);
        loadingEl.remove();
        renderTutorMessage(thread, response, false);
        chatHistory = chatHistory.concat([
          { role: 'user', content: value },
          { role: 'assistant', content: response.explanation },
        ]);
      } catch (err) {
        console.warn('Sabilearn: AI Tutor backend call failed.', err);
        loadingEl.remove();
        renderChatError(thread, "The AI Tutor couldn't get an answer from the backend. Check that it's running and try again.", () => send(value));
      }
    } else {
      const response = matchResponse(value);
      loadingEl.remove();
      renderTutorMessage(thread, response, false);
    }
    setBusy(false);
    input.focus();
  }

  root.querySelector('#tutor-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    ask(value);
  });

  thread.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-chip');
    if (!btn) return;
    if (btn.dataset.action === 'quiz' && quizLink) { window.location.href = quizLink; return; }
    if (btn.dataset.action === 'flashcards' && flashcardLink) { window.location.href = flashcardLink; return; }
    const labelMap = { simpler: 'Explain that more simply', example: 'Give me another example', deeper: 'Go deeper on this' };
    const label = labelMap[btn.dataset.action] || 'Tell me more';
    ask(label);
  });
}
