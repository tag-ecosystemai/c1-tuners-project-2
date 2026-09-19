// SABILEARN — AI Study Agent engine
// Acts like a chat-based AI assistant: the student just asks a question, and
// the agent scans across ALL of the student's courses/topics/materials to
// figure out what it's about, then answers grounded in that context.
// Wired to POST /study-agent/ on the backend (backend/app/routes/study_agent.py),
// which detects the relevant course itself and can also return quizzes,
// flashcards, or a study guide depending on the question. Falls back to the
// canned keyword-matched responses below if the backend call fails.

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
        ${context ? `<div class="tutor-source-chip">📖 Grounded in ${context.materialTitle || context.courseTitle}</div>` : `<div class="tutor-source-chip">📖 ${response.source || 'No specific material matched — answered generally'}</div>`}
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

// Formats whatever the backend's "answer" field is (a plain explanation, or
// a quiz/flashcards/study-guide payload from those special-cased branches)
// into the { explanation, analogy, example, source } shape the UI renders.
function formatBackendAnswer(answer) {
  if (typeof answer === 'string') {
    return { explanation: answer, analogy: '', example: '', source: 'Answered by the Sabilearn study agent' };
  }
  return {
    explanation: 'The study agent generated this for you — open the browser console for the full details.',
    analogy: '',
    example: '',
    source: 'Answered by the Sabilearn study agent',
  };
}

function initStudyAgent(root, { courses, materialsData }) {
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

  function ask(query) {
    document.getElementById('agent-suggestions')?.remove();
    renderAgentMessage(thread, query, true);
    askBackendOrFallback(query);
  }

  async function askBackendOrFallback(query) {
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/study-agent/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, history }),
      });
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      history = data.history || history;
      renderAgentMessage(thread, { response: formatBackendAnswer(data.answer), context: null }, false);
    } catch (err) {
      console.warn('Sabilearn: study agent backend call failed, using local mock response.', err);
      const context = detectContext(query, index);
      const response = matchCannedResponse(query);
      renderAgentMessage(thread, { response, context }, false);
    }
  }

  root.querySelector('#agent-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = root.querySelector('#agent-input');
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    ask(value);
  });

  thread.addEventListener('click', (e) => {
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
