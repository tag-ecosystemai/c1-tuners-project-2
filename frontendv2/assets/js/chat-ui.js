// SABILEARN — shared chat UI helpers (AI Tutor + Study Agent)
// Small DOM helpers for the "generating a response" loading bubble and the
// "something went wrong" error bubble, so both chat engines show the same
// loading/success/error states, plus two helpers for reading whatever the
// backend puts in its response.

// Appends a loading bubble (with an animated "..." indicator) to the given
// thread container and returns the element, so the caller can remove() it
// once the real response (or an error) is ready. The indicator stays
// visible for as long as the element exists — callers control that.
function renderChatLoading(container, label = 'Thinking') {
  const el = document.createElement('div');
  el.className = 'tutor-msg-ai tutor-msg-loading';
  el.innerHTML = `
    <div class="tutor-msg-label">✦ ${sabilearnEscapeHtml(label)}…</div>
    <span class="tutor-typing-dots"><span></span><span></span><span></span></span>
  `;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

// Appends an error bubble with a Retry button. onRetry is called (with no
// arguments) when the button is clicked; the bubble removes itself first.
// extraActions is an optional list of { label, onClick } secondary buttons
// (e.g. "Show demo answer"); they also remove the bubble before running.
function renderChatError(container, message, onRetry, extraActions = []) {
  const el = document.createElement('div');
  el.className = 'tutor-error-card';
  el.innerHTML = `
    <div>⚠ ${sabilearnEscapeHtml(message)}</div>
    <div class="tutor-error-actions">
      ${onRetry ? '<button type="button" class="btn btn-secondary btn-sm" data-retry>Retry</button>' : ''}
      ${extraActions.map((a, i) => `<button type="button" class="btn btn-secondary btn-sm" data-extra="${i}">${sabilearnEscapeHtml(a.label)}</button>`).join('')}
    </div>
  `;
  if (onRetry) {
    el.querySelector('[data-retry]').addEventListener('click', () => {
      el.remove();
      onRetry();
    });
  }
  extraActions.forEach((a, i) => {
    el.querySelector(`[data-extra="${i}"]`).addEventListener('click', () => {
      el.remove();
      a.onClick();
    });
  });
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

// Pulls a source/reference out of a backend response if one is present, at
// the top level or on the answer payload itself. Returns null when the
// backend didn't send one, so callers can simply not render a source chip
// (rather than inventing a label).
function extractSource(data) {
  const answer = data && data.answer;
  if (data && typeof data.source === 'string' && data.source.trim()) return data.source;
  if (data && Array.isArray(data.sources) && data.sources.length) return data.sources.map(sourceToText).join(', ');
  if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
    if (typeof answer.source === 'string' && answer.source.trim()) return answer.source;
    if (Array.isArray(answer.sources) && answer.sources.length) return answer.sources.map(sourceToText).join(', ');
    if (typeof answer.reference === 'string' && answer.reference.trim()) return answer.reference;
  }
  return null;
}

// A "source" may be a plain string or an object like { document_name, page }.
function sourceToText(s) {
  if (typeof s === 'string') return s;
  if (s && typeof s === 'object') return s.document_name || s.filename || s.title || s.name || s.source || JSON.stringify(s);
  return String(s);
}

// Turns a backend "answer" field into a text string for the Markdown
// renderer: strings pass through; objects use their text-like field; only
// as a last resort is the raw payload shown (as a code block).
function answerToText(answer) {
  if (typeof answer === 'string') return answer;
  if (answer && typeof answer === 'object' && !Array.isArray(answer)) {
    const text = answer.answer || answer.text || answer.content || answer.explanation;
    if (typeof text === 'string' && text.trim()) return text;
  }
  return '```\n' + JSON.stringify(answer, null, 2) + '\n```';
}
