// SABILEARN — tiny Markdown renderer for AI-generated chat responses
// (AI Tutor + Study Agent). No external dependency: escapes HTML first
// (so nothing in the model's output can inject markup), then supports
// paragraphs, bold, italic, inline code, bullet lists, numbered lists
// and simple headings — enough to render typical LLM answers cleanly.

// sabilearnEscapeHtml() lives in api-config.js (loaded before this file).

function sabilearnInlineMarkdown(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
}

// Converts a Markdown-ish string into safe HTML. Always returns a string
// (empty string for empty input) so callers can drop it straight into
// innerHTML.
function renderMarkdown(source) {
  if (!source) return '';
  const escaped = sabilearnEscapeHtml(source).replace(/\r\n/g, '\n');
  const lines = escaped.split('\n');

  const blocks = [];
  let listBuffer = [];
  let listType = null; // 'ul' | 'ol'
  let paraBuffer = [];

  function flushParagraph() {
    if (paraBuffer.length) {
      blocks.push(`<p>${sabilearnInlineMarkdown(paraBuffer.join(' '))}</p>`);
      paraBuffer = [];
    }
  }
  function flushList() {
    if (listBuffer.length) {
      const items = listBuffer.map((li) => `<li>${sabilearnInlineMarkdown(li)}</li>`).join('');
      blocks.push(`<${listType}>${items}</${listType}>`);
      listBuffer = [];
      listType = null;
    }
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)$/);
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);

    if (!line) { flushParagraph(); flushList(); return; }

    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = Math.min(headingMatch[1].length + 3, 6); // keep headings visually modest inside a chat bubble
      blocks.push(`<h${level}>${sabilearnInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }
    if (bulletMatch) {
      flushParagraph();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(bulletMatch[1]);
      return;
    }
    if (numberedMatch) {
      flushParagraph();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(numberedMatch[1]);
      return;
    }
    flushList();
    paraBuffer.push(line);
  });
  flushParagraph();
  flushList();

  return blocks.join('') || `<p>${sabilearnInlineMarkdown(escaped)}</p>`;
}
