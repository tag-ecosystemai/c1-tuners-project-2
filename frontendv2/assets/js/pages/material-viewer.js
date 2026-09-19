// SABILEARN — Material Viewer behavior
// For a real backend material, the title/type/course/upload date shown
// here are real (GET /courses/, GET /materials/course/:id). The backend
// has no file-content-extraction or file-serving endpoint yet, so the
// page body content itself is still a clearly-labeled placeholder rather
// than invented "real-looking" text — see renderPage(). The AI panel and
// Ask/Quiz/Flashcards actions are grounded in the real course either way.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function guessMaterialType(fileType) {
  const t = (fileType || '').toLowerCase();
  if (t.includes('presentation') || t.includes('powerpoint')) return 'slides';
  if (t.includes('audio')) return 'recording';
  if (t.includes('image')) return 'image';
  return 'document';
}

function mockPages(title) {
  return [
    `This section introduces the core ideas behind ${title}. Pay attention to how each concept builds on the one before it — the later pages depend on this foundation.`,
    `Building on the introduction, this page works through the mechanics in more detail. Where a diagram would normally appear, imagine a labeled illustration showing how the components relate to one another.`,
    `Here the material moves into worked examples. Walking through a concrete case tends to make the abstract description from the earlier pages click into place.`,
    `The final section ties everything together and previews how this topic connects to what comes next in the course.`,
  ];
}

// The backend can't extract/serve file content yet (no route for it in
// backend/app/routes/materials.py beyond metadata), so real materials get
// a page that says so plainly instead of generic-sounding placeholder
// prose that could be mistaken for the material's actual content.
function backendPendingPages(material) {
  return [
    `"${material.title}" has been uploaded and processed for AI search (it's available to the AI Tutor and for generating quizzes/flashcards from it). Full in-browser document viewing isn't available yet — the backend doesn't have a file-content or file-serving endpoint for this file type yet.`,
  ];
}

async function loadBackendMaterial(courseId, materialId) {
  const [coursesRes, materialsRes] = await Promise.all([
    sabilearnFetch(`${window.SABILEARN_API_BASE}/courses/`, {}, 8000),
    sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/course/${courseId}`, {}, 8000),
  ]);
  if (!coursesRes.ok) throw new Error(`Backend responded ${coursesRes.status}`);
  const coursesData = await coursesRes.json();
  const backendCourse = coursesData.courses.find((c) => String(c.id) === String(courseId));
  if (!backendCourse) throw new Error('Course not found on backend');

  if (!materialsRes.ok) throw new Error(`Backend responded ${materialsRes.status}`);
  const materialsData = await materialsRes.json();
  const backendMaterial = (materialsData.materials || []).find((m) => String(m.id) === String(materialId));
  if (!backendMaterial) throw new Error('Material not found on backend');

  const course = {
    id: String(backendCourse.id),
    code: backendCourse.code || 'COURSE',
    title: backendCourse.name,
  };
  const material = {
    id: String(backendMaterial.id),
    courseId: course.id,
    title: backendMaterial.filename,
    ext: (backendMaterial.filename.split('.').pop() || '').toUpperCase(),
    type: guessMaterialType(backendMaterial.file_type),
    date: backendMaterial.uploaded_at ? new Date(backendMaterial.uploaded_at).toLocaleDateString() : '',
  };
  return { course, material };
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const materialId = params.get('material') || 'm5';
  const courseId = params.get('course') || 'csc301';

  const pageContent = document.querySelector('.page-content');
  const errorBack = {
    backHref: isBackendId(courseId) ? `../courses/course.html?course=${courseId}&tab=materials` : 'library.html',
    backLabel: isBackendId(courseId) ? 'Back to course' : 'Back to Library',
  };

  let course;
  let material;
  let pages;

  if (typeof isBackendId === 'function' && isBackendId(courseId)) {
    // Real backend material: if it can't be loaded, say so. Never
    // substitute a demo material for it.
    try {
      if (!isBackendId(materialId)) throw new Error('Not a backend material id');
      ({ course, material } = await loadBackendMaterial(courseId, materialId));
      pages = backendPendingPages(material);
    } catch (err) {
      console.warn('Sabilearn: could not load material from backend.', err);
      sabilearnRenderPageError(pageContent, {
        title: "Couldn't load this material",
        message: "The backend didn't return this material. It may have been removed, or the backend isn't running.",
        onRetry: () => window.location.reload(),
        ...errorBack,
      });
      return;
    }
  } else {
    const [materialsData, { courses }] = await Promise.all([
      loadJSON('../../data/mock/materials.json'),
      loadJSON('../../data/mock/courses.json'),
    ]);
    course = courses.find((c) => c.id === courseId);
    const materials = course ? (materialsData[course.id] || []) : [];
    material = materials.find((m) => m.id === materialId);
    if (!course || !material) {
      sabilearnRenderPageError(pageContent, {
        title: 'Material not found',
        message: "We couldn't find this material.",
        ...errorBack,
      });
      return;
    }
    pages = mockPages(material.title);
  }

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

  // ---- AI panel (scoped to this material's course) ----
  initAiTutor(document.getElementById('viewer-ai-root'), {
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    quizLink: `../quizzes/quiz-setup.html?course=${course.id}&material=${material.id}`,
    flashcardLink: `../flashcards/flashcards.html?course=${course.id}`,
  });

  // ---- Header menu ----
  const isRealMaterial = typeof isBackendId === 'function' && isBackendId(courseId);
  const menuBtn = document.getElementById('viewer-menu-btn');
  const menuDropdown = document.getElementById('viewer-menu-dropdown');
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); menuDropdown.classList.toggle('is-open'); });
  document.addEventListener('click', () => menuDropdown.classList.remove('is-open'));
  // The backend has no rename/delete routes for materials (only upload and
  // list — see backend/app/routes/materials.py), so a real material says
  // so honestly instead of pretending the action worked.
  if (isRealMaterial) {
    ['viewer-menu-rename', 'viewer-menu-delete'].forEach((id) => {
      const btn = document.getElementById(id);
      btn.disabled = true;
      btn.title = 'Not supported yet for backend materials';
      btn.style.opacity = '.4';
      btn.style.cursor = 'not-allowed';
    });
  } else {
    document.getElementById('viewer-menu-rename').addEventListener('click', () => alert('Rename material — inline rename field would appear here.'));
    document.getElementById('viewer-menu-delete').addEventListener('click', () => {
      if (confirm(`Remove "${material.title}" from this course?`)) window.location.href = `../courses/course.html?course=${course.id}&tab=materials`;
    });
  }
});
