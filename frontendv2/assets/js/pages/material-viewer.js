// SABILEARN — Material Viewer behavior
// NOTE: Document content is mocked (no real file parsing yet). TODO: replace
// MOCK_PAGES with real extracted content from GET /materials/:id once the
// backend and file-processing pipeline exist.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function mockPages(title) {
  return [
    `This section introduces the core ideas behind ${title}. Pay attention to how each concept builds on the one before it — the later pages depend on this foundation.`,
    `Building on the introduction, this page works through the mechanics in more detail. Where a diagram would normally appear, imagine a labeled illustration showing how the components relate to one another.`,
    `Here the material moves into worked examples. Walking through a concrete case tends to make the abstract description from the earlier pages click into place.`,
    `The final section ties everything together and previews how this topic connects to what comes next in the course.`,
  ];
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const materialId = params.get('material') || 'm5';
  const courseId = params.get('course') || 'csc301';

  const [materialsData, { courses }] = await Promise.all([
    loadJSON('../../data/mock/materials.json'),
    loadJSON('../../data/mock/courses.json'),
  ]);

  const course = courses.find((c) => c.id === courseId) || courses[0];
  const materials = materialsData[course.id] || [];
  const material = materials.find((m) => m.id === materialId) || materials[0];
  const pages = mockPages(material.title);
  let currentPage = 0;

  document.getElementById('viewer-title').textContent = material.title;
  document.getElementById('viewer-meta').textContent = `${material.ext} · ${course.code}`;
  document.getElementById('back-link').href = `../courses/course.html?course=${course.id}&tab=materials`;

  function renderPage() {
    document.getElementById('viewer-doc-body').innerHTML = `<p>${pages[currentPage]}</p>`;
    document.getElementById('viewer-page-label').textContent = `Page ${currentPage + 1} of ${pages.length}`;
    document.getElementById('viewer-prev').disabled = currentPage === 0;
    document.getElementById('viewer-next').disabled = currentPage === pages.length - 1;
  }
  document.getElementById('viewer-prev').addEventListener('click', () => { if (currentPage > 0) { currentPage--; renderPage(); } });
  document.getElementById('viewer-next').addEventListener('click', () => { if (currentPage < pages.length - 1) { currentPage++; renderPage(); } });
  renderPage();

  // ---- Search ----
  document.getElementById('viewer-search-input').addEventListener('input', (e) => {
    const q = e.target.value.trim();
    const matches = pages.map((p, i) => (q && p.toLowerCase().includes(q.toLowerCase())) ? i + 1 : null).filter(Boolean);
    document.getElementById('viewer-search-results').textContent = q ? `${matches.length} result${matches.length === 1 ? '' : 's'} — page${matches.length === 1 ? '' : 's'} ${matches.join(', ') || 'none'}` : '';
  });

  // ---- AI panel toggle ----
  const layout = document.getElementById('viewer-layout');
  document.getElementById('viewer-panel-toggle').addEventListener('click', () => {
    layout.classList.toggle('panel-collapsed');
  });

  // ---- Action bar ----
  document.getElementById('action-summarize').addEventListener('click', () => {
    alert(`Key points from ${material.title}:\n\n• Builds foundational concepts before moving to mechanics\n• Includes a worked example\n• Connects to the next topic in ${course.title}`);
  });
  document.getElementById('action-quiz').addEventListener('click', () => {
    window.location.href = `../quizzes/quiz-setup.html?course=${course.id}&material=${material.id}`;
  });
  document.getElementById('action-flashcards').addEventListener('click', () => {
    window.location.href = `../flashcards/flashcards.html?course=${course.id}`;
  });

  // ---- AI panel (scoped to this material) ----
  initAiTutor(document.getElementById('viewer-ai-root'), {
    courseCode: course.code,
    courseTitle: course.title,
    quizLink: `../quizzes/quiz-setup.html?course=${course.id}&material=${material.id}`,
    flashcardLink: `../flashcards/flashcards.html?course=${course.id}`,
  });

  // ---- Header menu ----
  const menuBtn = document.getElementById('viewer-menu-btn');
  const menuDropdown = document.getElementById('viewer-menu-dropdown');
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); menuDropdown.classList.toggle('is-open'); });
  document.addEventListener('click', () => menuDropdown.classList.remove('is-open'));
  document.getElementById('viewer-menu-rename').addEventListener('click', () => alert('Rename material — inline rename field would appear here.'));
  document.getElementById('viewer-menu-delete').addEventListener('click', () => {
    if (confirm(`Remove "${material.title}" from this course?`)) window.location.href = `../courses/course.html?course=${course.id}&tab=materials`;
  });
});
