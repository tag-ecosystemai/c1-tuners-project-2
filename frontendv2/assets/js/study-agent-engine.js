// SABILEARN — AI Study Agent engine
// Acts like a chat-based AI assistant: the student just asks a question and
// the backend (POST /study-agent/, backend/app/routes/study_agent.py)
// detects the relevant course itself, resolves follow-up questions using
// the conversation history sent with each request, and can also return a
// quiz, flashcards or a study guide depending on the question.
//
// The canned keyword-matched demo answers below are kept as mock data, but
// they are never shown in place of a failed backend call: a failure shows
// an error bubble with Retry, and (only when the question matches a demo
// topic) an optional "Show demo answer" button that labels the answer as
// demo content.

const STOPWORDS = new Set(['what','is','are','the','a','an','how','why','does','do','of','to','in','on','for','me','my','explain','tell','about','can','you','please','and','with']);

const CANNED_RESPONSES = {
  backpropagation: {
    explanation: "Backpropagation is how a neural network learns from its mistakes. It checks how much each connection contributed to the final error, then adjusts those connections so the next prediction is better.",
    analogy: "It's like adjusting the dials on a radio: each small adjustment makes the signal clearer.",
    example: "If a model labels a cat as a dog, backpropagation helps identify which connections led to that mistake and nudges them in a better direction.",
  },
  'neural networks': {
    explanation: "A neural network is a set of connected layers of neurons, each computing a weighted sum of its inputs and passing it through an activation function to introduce non-linearity.",
    analogy: "Think of it like a chain of decision-makers, each passing a refined opinion to the next based on what they were told.",
    example: "Recognizing a handwritten digit: early layers detect edges, later layers combine those edges into shapes, and the final layer decides which digit it is.",
  },
  'search strategies': {
    explanation: "Search strategies are systematic ways of exploring possible solutions — like breadth-first search (explore level by level) or heuristic search (use an estimate of how close you are to the goal).",
    analogy: "It's like exploring a maze: breadth-first checks every nearby path before going deeper, while a heuristic search follows the path that looks most promising first.",
    example: "A GPS app uses heuristic search — it doesn't check every possible road, just the ones likely to get you there fastest.",
  },
  'laplace transforms': {
    explanation: "A Laplace transform converts a differential equation in time into an algebraic equation in a new variable, making it much easier to solve.",
    analogy: "It's like translating a hard problem into a different language where the grammar is simpler, solving it there, then translating the answer back.",
    example: "Solving a circuit's response to a sudden voltage change is far easier in the Laplace domain than working directly with the differential equation.",
  },
  "newton's laws": {
    explanation: "Newton's Laws describe how objects move: they stay at rest or in motion unless a force acts on them, force equals mass times acceleration, and every action has an equal and opposite reaction.",
    analogy: "Think of pushing a shopping cart: the heavier it is, the harder you have to push for the same acceleration — that's F = ma in action.",
    example: "When a rocket expels gas downward, the gas pushes the rocket upward with equal force — that's the third law.",
  },
  default: {
    explanation: "Here's a useful way to think about \u201c{{Q}}\u201d: start with what you already know, compare it with the expected idea, and work backward to see where the gap is. That's usually where the real understanding happens.",
    analogy: "Think of it like retracing your steps to find where you took a wrong turn.",
    example: "Try asking a more specific question — the more precise it is, the better I can ground the answer in your actual materials.",
  },
};

function buildSearchIndex(courses, materialsData) {
  const index = [];
  courses.forEach((c) => {
    c.topics.forEach((t) => index.push({ courseId: c.id, courseCode: c.code, courseTitle: c.title, kind: 'topic', name: t.name }));
    (materialsData[c.id] || []).forEach((m) => index.push({ courseId: c.id, courseCode: c.code, courseTitle: c.title, kind: 'material', name: m.title }));
  });
  return index;
}

function tokenize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w && !STOPWORDS.has(w));
}

function detectContext(query, index) {
  const qTokens = new Set(tokenize(query));
  let best = null, bestScore = 0;
  index.forEach((entry) => {
    const entryTokens = tokenize(entry.name);
    const overlap = entryTokens.filter((t) => qTokens.has(t)).length;
    if (overlap > bestScore) { bestScore = overlap; best = entry; }
  });
  if (bestScore === 0) return null;

  // Prefer a material from the same course whose own title also overlaps the
  // query; fall back to any material from that course if none matches as well.
  const courseMaterials = index.filter((e) => e.courseId === best.courseId && e.kind === 'material');
  let bestMaterial = null, bestMaterialScore = 0;
  courseMaterials.forEach((m) => {
    const overlap = tokenize(m.name).filter((t) => qTokens.has(t)).length;
    if (overlap > bestMaterialScore) { bestMaterialScore = overlap; bestMaterial = m; }
  });
  const material = bestMaterial || courseMaterials[0];
  return { ...best, materialTitle: material?.name };
}

// Returns a demo answer only when the question actually mentions one of the
// demo topics; null otherwise (the generic default answer is not offered).
function findCannedResponse(query) {
  const q = query.toLowerCase();
  const key = Object.keys(CANNED_RESPONSES).find((k) => k !== 'default' && q.includes(k));
  return key ? { ...CANNED_RESPONSES[key], source: 'Demo content — not from your materials' } : null;
}

function matchCannedResponse(query) {
  const q = query.toLowerCase();
  for (const key of Object.keys(CANNED_RESPONSES)) {
    if (key !== 'default' && q.includes(key)) return CANNED_RESPONSES[key];
  }
  const fallback = { ...CANNED_RESPONSES.default };
  fallback.explanation = fallback.explanation.replace('{{Q}}', query);
  return fallback;
}

function renderAgentMessage(container, content, isUser) {
  const el = document.createElement('div');
  if (isUser) {
    el.className = 'tutor-msg-user';
    el.textContent = content;
  } else {
    el.className = 'tutor-msg-ai';
    const { response, context } = content;
    el.innerHTML = `
      <div class="tutor-msg-label">✦ Sabilearn agent</div>
      ${context ? `<div class="agent-detected-chip">🔎 Detected: <strong>${context.courseCode}</strong>${context.materialTitle ? ` · ${context.materialTitle}` : ''}</div>` : ''}
      <div class="tutor-response-card">
        ${response.generated ? renderGeneratedHtml(response.generated) : `
        <div class="tutor-response-label">Explanation</div>
        <div class="tutor-markdown">${renderMarkdown(response.explanation)}</div>`}
        ${response.analogy ? `
        <div class="tutor-analogy-box">
          <div class="tutor-response-label">Simple analogy</div>
          <div class="tutor-markdown">${renderMarkdown(response.analogy)}</div>
        </div>` : ''}
        ${response.example ? `
        <div class="tutor-response-label" style="margin-top:14px;">Example</div>
        <div class="tutor-markdown">${renderMarkdown(response.example)}</div>` : ''}
        ${response.source
          ? `<div class="tutor-source-chip">📖 ${sabilearnEscapeHtml(response.source)}</div>`
          : context
            ? `<div class="tutor-source-chip">📖 Grounded in ${sabilearnEscapeHtml(context.materialTitle || context.courseTitle)}</div>`
            : ''}
      </div>
      <div class="tutor-quick-actions">
        <button class="quick-chip" data-action="simpler">Explain simpler</button>
        <button class="quick-chip" data-action="example">Give me an example</button>
        ${context ? `<button class="quick-chip" data-action="quiz" data-course="${context.courseId}">Quiz me on this</button>` : ''}
        ${context ? `<button class="quick-chip" data-action="flashcards" data-course="${context.courseId}">Create flashcards</button>` : ''}
      </div>
    `;
  }
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}

// Some backend branches (quiz / flashcards) may return their payload as a
// JSON string, or wrapped in a code fence. Try to recover the real object.
function parseMaybeJson(answer) {
  if (typeof answer !== 'string') return answer;
  const t = answer.trim();
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  const candidate = fenced ? fenced[1].trim() : t;
  if (candidate.startsWith('[') || candidate.startsWith('{')) {
    try { return JSON.parse(candidate); } catch (err) { /* not JSON — plain text */ }
  }
  return answer;
}

// Recognizes a quiz or a set of flashcards inside the backend's "answer" so
// they can be rendered as real UI instead of a raw JSON block. Reuses the
// same normalizers as POST /quiz/ and POST /flashcards/ (see
// generated-content-store.js). Returns { kind, items } or null.
function detectGenerated(answer) {
  const a = parseMaybeJson(answer);
  const list = Array.isArray(a) ? a
    : (a && typeof a === 'object')
      ? (a.quiz?.questions || a.quiz || a.questions || a.flashcards?.cards || a.flashcards || a.cards)
      : null;
  if (!Array.isArray(list) || !list.length || !list[0] || typeof list[0] !== 'object') return null;
  const first = list[0];
  if (first.options || first.choices || Array.isArray(first.answers)) {
    const questions = sabilearnNormalizeQuizQuestions(list);
    if (questions.length) return { kind: 'quiz', items: questions };
  }
  const cards = sabilearnNormalizeCards(list);
  if (cards.length) return { kind: 'flashcards', items: cards };
  return null;
}

// Formats the backend's response into the { explanation, analogy, example,
// source, generated } shape the UI renders. A plain answer (or a study
// guide) is a Markdown string; quizzes and flashcards come through as
// `generated`.
function formatBackendAnswer(data) {
  const source = extractSource(data);
  const generated = detectGenerated(data.answer);
  if (generated) {
    return { explanation: '', analogy: '', example: '', source, generated };
  }
  return { explanation: answerToText(data.answer), analogy: '', example: '', source, generated: null };
}

function renderGeneratedHtml(gen) {
  const esc = sabilearnEscapeHtml;
  if (gen.kind === 'quiz') {
    return `
      <div class="agent-generated" data-kind="quiz">
        <div class="tutor-response-label">Quiz · ${gen.items.length} question${gen.items.length === 1 ? '' : 's'}</div>
        ${gen.items.map((q, i) => `
          <div class="agent-quiz-q">
            <div class="agent-quiz-q-text">${i + 1}. ${esc(q.q)}</div>
            <ol class="agent-quiz-options" type="A">
              ${q.options.map((o, oi) => `<li data-correct="${oi === q.correct ? 1 : 0}">${esc(o)}</li>`).join('')}
            </ol>
            ${q.why ? `<div class="agent-quiz-why">${esc(q.why)}</div>` : ''}
          </div>
        `).join('')}
        <button type="button" class="btn btn-secondary btn-sm" data-reveal-answers>Show answers</button>
      </div>`;
  }
  return `
    <div class="agent-generated" data-kind="flashcards">
      <div class="tutor-response-label">Flashcards · ${gen.items.length} card${gen.items.length === 1 ? '' : 's'} (tap a card to flip)</div>
      ${gen.items.map((c) => `
        <div class="agent-card" data-flip>
          <div class="agent-card-q">${esc(c.q)}</div>
          <div class="agent-card-a">${esc(c.a)}</div>
        </div>
      `).join('')}
    </div>`;
}

function initStudyAgent(root, { courses, materialsData, backendCourses = [] }) {
  const index = buildSearchIndex(courses, materialsData);
  let history = [];

  root.innerHTML = `
    <div class="tutor-card agent-card">
      <div class="tutor-card-header">
        <span class="badge">✦ AI Study Agent</span>
        <h3>Ask me anything about your courses</h3>
        <p>I'll figure out which course and material it's about — no need to pick one yourself.</p>
      </div>
      <div class="tutor-thread agent-thread" id="agent-thread">
        <div class="agent-suggestions" id="agent-suggestions">
          <div class="agent-suggestions-label">Try asking:</div>
          <button class="quick-chip" data-suggest="What is backpropagation?">What is backpropagation?</button>
          <button class="quick-chip" data-suggest="Explain Newton's Laws">Explain Newton's Laws</button>
          <button class="quick-chip" data-suggest="What are Laplace transforms?">What are Laplace transforms?</button>
          <button class="quick-chip" data-suggest="How does search strategies work?">How does search work in AI?</button>
          ${backendCourses.slice(0, 3).map((c) => `<button class="quick-chip" data-suggest="${sabilearnEscapeHtml(`Create a study guide for ${c.name}`)}">Study guide: ${sabilearnEscapeHtml(c.name)}</button>`).join('')}
        </div>
      </div>
      <form class="tutor-input-row" id="agent-form">
        <input type="text" id="agent-input" placeholder="Ask a question about anything you're studying..." autocomplete="off">
        <button type="submit" class="tutor-send-btn" aria-label="Send">➤</button>
      </form>
      <p class="tutor-input-note">Automatically searches across all your courses and materials.</p>
    </div>
  `;

  const thread = root.querySelector('#agent-thread');
  const input = root.querySelector('#agent-input');
  const sendBtn = root.querySelector('.tutor-send-btn');

  function setBusy(busy) {
    input.disabled = busy;
    sendBtn.disabled = busy;
  }

  // Renders the user's message once, then sends it. Retry calls send()
  // directly so the question isn't shown twice.
  function ask(query) {
    document.getElementById('agent-suggestions')?.remove();
    renderAgentMessage(thread, query, true);
    send(query);
  }

  async function send(query) {
    setBusy(true);
    const loadingEl = renderChatLoading(thread, 'Sabilearn agent is thinking');
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/study-agent/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, history }),
      }, 60000);
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      history = data.history || history;
      loadingEl.remove();
      renderAgentMessage(thread, { response: formatBackendAnswer(data), context: null }, false);
    } catch (err) {
      console.warn('Sabilearn: study agent backend call failed.', err);
      loadingEl.remove();
      // The demo answer (mock data) is only offered on request and is
      // labelled as demo content; it is never passed off as the backend's.
      const demo = findCannedResponse(query);
      const extra = demo ? [{
        label: 'Show demo answer',
        onClick: () => renderAgentMessage(thread, { response: demo, context: detectContext(query, index) }, false),
      }] : [];
      renderChatError(thread, "The Study Agent couldn't get an answer from the backend. Check that it's running and try again.", () => send(query), extra);
    }
    setBusy(false);
    input.focus();
  }

  root.querySelector('#agent-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    ask(value);
  });

  thread.addEventListener('click', (e) => {
    const reveal = e.target.closest('[data-reveal-answers]');
    if (reveal) {
      const box = reveal.closest('.agent-generated');
      const on = box.classList.toggle('is-revealed');
      reveal.textContent = on ? 'Hide answers' : 'Show answers';
      return;
    }
    const flip = e.target.closest('[data-flip]');
    if (flip) { flip.classList.toggle('is-flipped'); return; }

    const suggest = e.target.closest('[data-suggest]');
    if (suggest) { ask(suggest.dataset.suggest); return; }

    const btn = e.target.closest('.quick-chip');
    if (!btn) return;
    if (btn.dataset.action === 'quiz') { window.location.href = `../quizzes/quiz-setup.html?course=${btn.dataset.course}`; return; }
    if (btn.dataset.action === 'flashcards') { window.location.href = `../flashcards/flashcards.html?course=${btn.dataset.course}`; return; }
    const labelMap = { simpler: 'Can you explain that more simply?', example: 'Give me another example' };
    ask(labelMap[btn.dataset.action] || 'Tell me more');
  });

  return { ask };
}
