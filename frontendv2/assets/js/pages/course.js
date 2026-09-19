// SABILEARN — Course Workspace behavior
// Wired to the backend for real (integer-id) courses:
//   - GET /courses/            → course name/code/description
//   - GET /materials/course/:id → the materials list
//   - DELETE /courses/:id      → deleting a course
// Mock demo courses (string slugs like "csc301") keep using the local mock
// JSON exactly as before. The backend has no concept of topics, progress,
// quizzes, flashcards or study time, so those sections show empty/neutral
// state for real backend courses instead of being faked.

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

async function loadBackendCourse(courseId) {
  const [coursesRes, materialsRes] = await Promise.all([
    sabilearnFetch(`${window.SABILEARN_API_BASE}/courses/`, {}, 8000),
    sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/course/${courseId}`, {}, 8000),
  ]);
  if (!coursesRes.ok) throw new Error(`Backend responded ${coursesRes.status}`);
  const coursesData = await coursesRes.json();
  const backendCourse = coursesData.courses.find((c) => String(c.id) === String(courseId));
  if (!backendCourse) throw new Error('Course not found on backend');

  let backendMaterials = [];
  if (materialsRes.ok) {
    const materialsData = await materialsRes.json();
    backendMaterials = materialsData.materials || [];
  }

  const course = {
    id: String(backendCourse.id),
    code: backendCourse.code || 'COURSE',
    title: backendCourse.name,
    description: backendCourse.description || '',
    instructor: 'You',
    materialsCount: backendMaterials.length,
    progress: 0,
    continueTopic: 'your materials',
    topics: [],
    quizzesCompleted: 0,
    flashcardsReviewed: 0,
    studyTime: '—',
    recentActivity: [],
  };

  const materials = backendMaterials.map((m) => ({
    id: String(m.id),
    title: m.filename,
    ext: (m.filename.split('.').pop() || '').toUpperCase(),
    size: '—',
    date: m.uploaded_at ? new Date(m.uploaded_at).toLocaleDateString() : '',
    type: guessMaterialType(m.file_type),
  }));

  return { course, materials };
}

function ringSVG(pct, size = 56) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return `
    <svg class="progress-ring-lg" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--color-border)" stroke-width="5"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--color-primary)" stroke-width="5"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" stroke-linecap="round"
        transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>
  `;
}

const MATERIAL_ICONS = { document: '\u{1F4C4}', slides: '\u{1F5B5}', recording: '\u{1F3A7}', image: '\u{1F5BC}' };

// Calls POST /flashcards/ on the backend (backend/app/routes/flashcards.py)
// for this course, caches the real generated deck locally (the backend has
// no endpoint yet to store/list decks — see generated-content-store.js),
// and jumps straight into studying it.
async function generateFlashcardsForCourse(course, topic, triggerBtn) {
  if (!(typeof isBackendId === 'function' && isBackendId(course.id))) {
    window.location.href = '../flashcards/flashcards.html';
    return;
  }
  const originalLabel = triggerBtn ? triggerBtn.textContent : null;
  if (triggerBtn) { triggerBtn.textContent = 'Generating\u2026'; triggerBtn.disabled = true; }
  try {
    const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/flashcards/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: Number(course.id), topic: topic || null, num_cards: 10 }),
    }, 60000);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    const backendFlashcards = await res.json();
    const deck = normalizeBackendFlashcards(backendFlashcards, {
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
      topic,
    });
    if (!deck.cards.length) throw new Error('Backend returned no usable flashcards');
    saveGeneratedDeck(deck);
    window.location.href = `../flashcards/flashcard-study.html?deck=${deck.id}&course=${course.id}`;
  } catch (err) {
    console.warn('Sabilearn: flashcard generation backend call failed.', err);
    if (triggerBtn) { triggerBtn.textContent = originalLabel; triggerBtn.disabled = false; }
    alert("We couldn't generate flashcards from the backend right now. Please try again.");
  }
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('course') || 'csc301';
  const initialTab = params.get('tab') || 'overview';

  const [{ courses }, materialsData, quizData, flashcardData] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    loadJSON('../../data/mock/materials.json'),
    loadJSON('../../data/mock/quizzes.json'),
    loadJSON('../../data/mock/flashcards.json'),
  ]);

  const pageContent = document.querySelector('.page-content');
  let course;
  let materials;
  if (typeof isBackendId === 'function' && isBackendId(courseId)) {
    // Real backend course: if it can't be loaded, say so. Never substitute
    // a demo course for it.
    try {
      ({ course, materials } = await loadBackendCourse(courseId));
    } catch (err) {
      console.warn('Sabilearn: could not load course from backend.', err);
      sabilearnRenderPageError(pageContent, {
        title: "Couldn't load this course",
        message: "The backend didn't return this course. It may have been deleted, or the backend isn't running.",
        onRetry: () => window.location.reload(),
        backHref: 'my-courses.html',
        backLabel: 'Back to My Courses',
      });
      return;
    }
  } else {
    course = courses.find((c) => c.id === courseId);
    if (!course) {
      sabilearnRenderPageError(pageContent, {
        title: 'Course not found',
        message: "We couldn't find a course with this id.",
        backHref: 'my-courses.html',
        backLabel: 'Back to My Courses',
      });
      return;
    }
    materials = materialsData[course.id] || [];
  }

  // Single source of truth for "is this a real backend course" — the
  // backend has no PATCH /courses/:id and no material delete/move/rename
  // routes (see backend/app/routes/courses.py, materials.py), so several
  // menu actions below need to be honest about that for backend courses
  // instead of pretending to save.
  const isRealCourse = typeof isBackendId === 'function' && isBackendId(course.id);

  // ---- Header ----
  document.getElementById('course-badge').textContent = course.code;
  document.getElementById('course-title').textContent = course.title;
  document.getElementById('course-meta').textContent = `${course.instructor} · ${course.materialsCount} learning materials`;
  document.getElementById('course-ring').innerHTML = ringSVG(course.progress) + `<div class="progress-ring-lg-value">${course.progress}%</div>`;

  // ---- Header menu ----
  const menuBtn = document.getElementById('course-menu-btn');
  const menuDropdown = document.getElementById('course-menu-dropdown');
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); menuDropdown.classList.toggle('is-open'); });
  document.addEventListener('click', () => menuDropdown.classList.remove('is-open'));
  document.getElementById('menu-add-material').addEventListener('click', () => {
    document.querySelector('.workspace-tab[data-tab="materials"]').click();
    courseUploadModal.open();
  });
  document.getElementById('menu-edit-course').addEventListener('click', () => openEditCourseModal(course, { supported: !isRealCourse }));
  document.getElementById('menu-archive-course').addEventListener('click', async () => {
    const ok = await sabilearnDialog({
      title: 'Archive this course?',
      body: 'This course will be removed from your active courses, but your learning data will be kept.',
      confirmLabel: 'Archive Course',
      icon: '\u{1F4E6}',
    });
    if (ok) {
      const archived = JSON.parse(sessionStorage.getItem('archivedCourses') || '[]');
      archived.push(course.id);
      sessionStorage.setItem('archivedCourses', JSON.stringify(archived));
      window.location.href = 'my-courses.html';
    }
  });
  document.getElementById('menu-delete-course').addEventListener('click', async () => {
    const ok = await sabilearnDialog({
      title: 'Delete this course?',
      body: 'Deleting this course will permanently remove the course and its associated learning content and data.',
      affected: ['Materials', 'Course quizzes', 'Flashcard decks', 'Study activity', 'Course progress', 'Course-specific learning history'],
      confirmLabel: 'Delete Course',
      danger: true,
      icon: '\u26A0',
    });
    if (!ok) return;
    if (typeof isBackendId === 'function' && isBackendId(course.id)) {
      try {
        const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/courses/${course.id}`, { method: 'DELETE' }, 8000);
        if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      } catch (err) {
        console.warn('Sabilearn: failed to delete course on backend.', err);
      }
    }
    window.location.href = 'my-courses.html';
  });

  // ---- Overview tab ----
  document.getElementById('continue-mini-title').textContent = `Continue: ${course.continueTopic}`;
  document.getElementById('continue-learning-btn').addEventListener('click', () => {
    window.location.href = `../study/study-session.html?course=${course.id}`;
  });
  document.getElementById('overview-stat-grid').innerHTML = `
    <div class="overview-stat"><div class="value">${course.topics.length}</div><div class="label">Topics</div></div>
    <div class="overview-stat"><div class="value">${course.quizzesCompleted}</div><div class="label">Quizzes completed</div></div>
    <div class="overview-stat"><div class="value">${course.flashcardsReviewed}</div><div class="label">Flashcards reviewed</div></div>
    <div class="overview-stat"><div class="value">${course.studyTime}</div><div class="label">Study time</div></div>
  `;
  const weakest = course.topics.length ? [...course.topics].sort((a, b) => a.mastery - b.mastery)[0] : null;
  if (weakest) {
    document.getElementById('recommended-title').textContent = `Review ${weakest.name}`;
    document.getElementById('recommended-study-btn').addEventListener('click', () => {
      window.location.href = `../study/study-session.html?course=${course.id}&topic=${encodeURIComponent(weakest.name)}`;
    });
  } else {
    document.getElementById('recommended-title').textContent = 'Add materials to get topic recommendations';
    document.getElementById('recommended-study-btn').setAttribute('disabled', 'true');
  }
  document.getElementById('overview-topics').innerHTML = course.topics.length ? course.topics.map((t) => `
    <a href="../progress/topic-details.html?course=${course.id}&topic=${encodeURIComponent(t.name)}" class="topic-mastery-row" style="text-decoration:none; color:inherit;">
      <span>${t.name}</span>
      <div class="topic-mastery-track"><div class="topic-mastery-fill" style="width:${t.mastery}%"></div></div>
      <span>${t.mastery}%</span>
    </a>
  `).join('') : `<p style="color:var(--color-text-faint);">No topics yet — they'll appear once materials have been processed.</p>`;
  document.getElementById('overview-activity').innerHTML = course.recentActivity.length ? course.recentActivity.map((a) => `
    <div class="activity-row"><div>${a}</div></div>
  `).join('') : `<p style="color:var(--color-text-faint);">No recent activity yet.</p>`;

  // ---- Materials tab ----
  const materialActions = ['Open', 'Ask AI', 'Summarize', 'Generate Quiz', 'Generate Flashcards', 'Move', 'Rename', 'Delete'];

  function renderMaterialsGrid() {
    if (materials.length === 0) {
      document.getElementById('materials-grid').innerHTML = `
        <div class="empty-course-block" style="grid-column:1/-1;">
          <div class="icon">📁</div>
          <h3>No materials yet</h3>
          <p>Add your notes, slides, documents or recordings to start learning with AI.</p>
          <button class="btn btn-primary" id="empty-add-material">+ Add Material</button>
        </div>
      `;
      document.getElementById('empty-add-material')?.addEventListener('click', () => courseUploadModal.open());
      return;
    }

    // The backend has no delete/move/rename endpoints for materials (only
    // upload and list — see backend/app/routes/materials.py), so for a
    // real backend course those three actions are marked and treated as
    // unsupported instead of pretending to persist. Mock/demo materials
    // keep the exact same simulated behavior as before.
    const NOT_SUPPORTED_FOR_BACKEND = new Set(['Move', 'Rename', 'Delete']);

    document.getElementById('materials-grid').innerHTML = materials.map((m, i) => `
      <div class="card material-card">
        <div class="material-icon">${MATERIAL_ICONS[m.type] || '\u{1F4C4}'}</div>
        <div class="material-card-body">
          <div class="material-card-title">${m.title}</div>
          <div class="material-card-meta">${m.ext} · ${m.size} · ${m.date}</div>
        </div>
        <button class="material-menu-btn" data-mi="${i}">⋯</button>
        <div class="material-menu-dropdown" id="material-menu-${i}">
          ${materialActions.map((a) => (isRealCourse && NOT_SUPPORTED_FOR_BACKEND.has(a))
            ? `<button data-action="${a}" data-mi="${i}" disabled title="Not supported yet for backend courses" style="opacity:.4; cursor:not-allowed;">${a} (not supported)</button>`
            : `<button data-action="${a}" data-mi="${i}">${a}</button>`
          ).join('')}
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.material-menu-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = document.getElementById(`material-menu-${btn.dataset.mi}`);
        document.querySelectorAll('.material-menu-dropdown').forEach((d) => { if (d !== dd) d.classList.remove('is-open'); });
        dd.classList.toggle('is-open');
      });
    });
    document.addEventListener('click', () => document.querySelectorAll('.material-menu-dropdown').forEach((d) => d.classList.remove('is-open')));
    document.querySelectorAll('.material-menu-dropdown button').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (btn.disabled) return;
        const m = materials[Number(btn.dataset.mi)];
        if (btn.dataset.action === 'Open') {
          window.location.href = `../library/material-viewer.html?material=${m.id}&course=${course.id}`;
        } else if (btn.dataset.action === 'Ask AI') {
          if (isRealCourse) {
            // Real material — the AI panel on this page is already
            // grounded in this course's real content, so point there
            // instead of a placeholder.
            activateTab('ai-tutor');
          } else {
            alert(`"Ask AI" on ${m.title} — grounded in this material once connected to the backend.`);
          }
        } else if (btn.dataset.action === 'Generate Quiz') {
          window.location.href = `../quizzes/quiz-setup.html?course=${course.id}&material=${m.id}`;
        } else if (btn.dataset.action === 'Generate Flashcards') {
          generateFlashcardsForCourse(course, null, btn);
        } else if (btn.dataset.action === 'Delete') {
          const ok = await sabilearnDialog({
            title: 'Delete this material?',
            body: `This will remove "${m.title}" from your library and course. Existing quizzes and flashcards created from it may no longer be able to reference the original source.`,
            confirmLabel: 'Delete Material',
            danger: true,
            icon: '\u26A0',
          });
          if (ok) btn.closest('.material-card').remove();
        } else if (btn.dataset.action === 'Move') {
          openMoveMaterialModal(m, course, courses);
        } else {
          alert(`"${btn.dataset.action}" on ${m.title} — grounded in this material once connected to the backend.`);
        }
      });
    });
  }

  // Re-pulls this course's materials from the backend (after a successful
  // upload) and re-renders the grid in place — no navigation, no reload.
  async function refreshCourseMaterials() {
    if (!(typeof isBackendId === 'function' && isBackendId(course.id))) return;
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/course/${course.id}`, {}, 8000);
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      const backendMaterials = data.materials || [];
      materials = backendMaterials.map((m) => ({
        id: String(m.id),
        title: m.filename,
        ext: (m.filename.split('.').pop() || '').toUpperCase(),
        size: '—',
        date: m.uploaded_at ? new Date(m.uploaded_at).toLocaleDateString() : '',
        type: guessMaterialType(m.file_type),
      }));
      course.materialsCount = materials.length;
      document.getElementById('course-meta').textContent = `${course.instructor} · ${course.materialsCount} learning materials`;
      renderMaterialsGrid();
    } catch (err) {
      console.warn('Sabilearn: failed to refresh materials after upload.', err);
    }
  }

  // Called by the upload modal once files have finished uploading, whether
  // that was a real backend upload (re-fetch the course's materials) or the
  // simulated flow for a mock/demo course (append locally so the grid still
  // reflects what was "added").
  async function handleMaterialsUploaded(opts) {
    if (typeof isBackendId === 'function' && isBackendId(course.id)) {
      await refreshCourseMaterials();
      return;
    }
    if (opts && opts.simulatedFiles) {
      const newItems = opts.simulatedFiles.map((f, i) => ({
        id: `local-${Date.now()}-${i}`,
        title: f.name,
        ext: (f.name.split('.').pop() || '').toUpperCase(),
        size: f.size < 1024 * 1024 ? `${Math.max(1, Math.round(f.size / 1024))} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
        date: new Date().toLocaleDateString(),
        type: 'document',
      }));
      materials = materials.concat(newItems);
      course.materialsCount = materials.length;
      document.getElementById('course-meta').textContent = `${course.instructor} · ${course.materialsCount} learning materials`;
      renderMaterialsGrid();
    }
  }

  const courseUploadModal = wireCourseUploadModal(course, handleMaterialsUploaded);
  renderMaterialsGrid();
  document.getElementById('add-material-btn')?.addEventListener('click', () => courseUploadModal.open());

  // ---- AI Tutor tab ----
  const isRealCourseForTutorLinks = typeof isBackendId === 'function' && isBackendId(course.id);
  const courseQuizzes = quizData.quizzes.filter((q) => q.courseId === course.id);
  const courseDecks = flashcardData.decks.filter((d) => d.courseId === course.id);
  const firstGeneratedQuiz = isRealCourseForTutorLinks ? getGeneratedQuizzes(course.id)[0] : null;
  const firstGeneratedDeck = isRealCourseForTutorLinks ? getGeneratedDecks(course.id)[0] : null;
  initAiTutor(document.getElementById('tutor-pane-root'), {
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    quizLink: isRealCourseForTutorLinks
      ? (firstGeneratedQuiz ? `../quizzes/quiz-taking.html?quiz=${firstGeneratedQuiz.id}&course=${course.id}` : `../quizzes/quiz-setup.html?course=${course.id}`)
      : (courseQuizzes[0] ? `../quizzes/quiz-taking.html?quiz=${courseQuizzes[0].id}&course=${course.id}` : null),
    flashcardLink: isRealCourseForTutorLinks
      ? (firstGeneratedDeck ? `../flashcards/flashcard-study.html?deck=${firstGeneratedDeck.id}&course=${course.id}` : `../flashcards/flashcards.html?course=${course.id}`)
      : (courseDecks[0] ? `../flashcards/flashcard-study.html?deck=${courseDecks[0].id}&course=${course.id}` : null),
  });

  // ---- Quizzes tab ----
  // For a real backend course, "quizzes belonging to this course" means
  // quizzes actually generated from it via POST /quiz/ (cached locally
  // since the backend can't list them back — see generated-content-store.js),
  // not the mock quiz bank.
  const isRealCourseForGenerated = typeof isBackendId === 'function' && isBackendId(course.id);
  const generatedQuizzes = isRealCourseForGenerated ? getGeneratedQuizzes(course.id) : [];
  const generatedQuizHistory = isRealCourseForGenerated ? getQuizHistory(course.id) : [];
  const quizzesToShow = isRealCourseForGenerated ? generatedQuizzes : courseQuizzes;

  document.getElementById('quizzes-list').innerHTML = `
    <div class="materials-toolbar">
      <div><h3>Quizzes</h3><p>Only quizzes belonging to this course.</p></div>
      <a href="../quizzes/quiz-setup.html?course=${course.id}" class="btn btn-primary btn-sm">+ Generate Quiz</a>
    </div>
  ` + (quizzesToShow.length ? quizzesToShow.map((q) => {
    const hist = isRealCourseForGenerated
      ? generatedQuizHistory.find((h) => h.quizId === q.id)
      : quizData.history.find((h) => h.quizId === q.id);
    const statusLabel = hist?.status === 'completed' ? `${hist.score}/${hist.total} · Review` : hist?.status === 'in-progress' ? 'Continue' : 'Start';
    return `
      <a href="../quizzes/quiz-taking.html?quiz=${q.id}&course=${course.id}" class="card list-item-card" style="display:flex;">
        <div>
          <div class="list-item-title">${q.title}</div>
          <div class="list-item-meta">${q.questions.length} questions · ${q.difficulty}</div>
        </div>
        <span class="card-link">${statusLabel} →</span>
      </a>
    `;
  }).join('') : `
    <div class="empty-course-block">
      <div class="icon">?</div>
      <h3>No quizzes yet</h3>
      <p>Generate a quiz from your course materials to test your understanding.</p>
      <a href="../quizzes/quiz-setup.html?course=${course.id}" class="btn btn-primary">Generate Quiz</a>
    </div>
  `);

  // ---- Flashcards tab ----
  const generatedDecks = isRealCourseForGenerated ? getGeneratedDecks(course.id) : [];
  const decksToShow = isRealCourseForGenerated ? generatedDecks : courseDecks;

  document.getElementById('flashcards-list').innerHTML = `
    <div class="materials-toolbar">
      <div><h3>Flashcards</h3><p>Only flashcards belonging to this course.</p></div>
      <button class="btn btn-primary btn-sm" id="course-generate-flashcards-btn">+ Generate Deck</button>
    </div>
  ` + (decksToShow.length ? decksToShow.map((d) => `
    <a href="../flashcards/deck-details.html?deck=${d.id}&course=${course.id}" class="card list-item-card" style="display:flex;">
      <div>
        <div class="list-item-title">${d.title}</div>
        <div class="list-item-meta">${d.totalCards} cards ${d.dueCount ? `· ${d.dueCount} due` : ''}</div>
      </div>
      <span class="card-link">${d.dueCount ? 'Study' : 'Start'} →</span>
    </a>
  `).join('') : `
    <div class="empty-course-block">
      <div class="icon">▭</div>
      <h3>No flashcards yet</h3>
      <p>Generate flashcards from your course materials to build recall.</p>
      <button class="btn btn-primary" id="course-generate-flashcards-empty-btn">Generate Flashcards</button>
    </div>
  `);
  document.getElementById('course-generate-flashcards-btn')?.addEventListener('click', (e) => generateFlashcardsForCourse(course, null, e.currentTarget));
  document.getElementById('course-generate-flashcards-empty-btn')?.addEventListener('click', (e) => generateFlashcardsForCourse(course, null, e.currentTarget));

  // ---- Tab switching ----
  function activateTab(tabName) {
    document.querySelectorAll('.workspace-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === tabName));
    document.querySelectorAll('.workspace-pane').forEach((p) => p.classList.toggle('is-active', p.id === `pane-${tabName}`));
  }
  document.querySelectorAll('.workspace-tab').forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  });
  activateTab(initialTab);
});

// ---- Add Material modal (course-scoped) ----
// Uploads happen directly from inside the course workspace: no redirect to
// the Library. Real backend courses POST straight to /materials/upload
// with this course's id and the materials grid is refreshed in place once
// done (via onUploaded). Mock/demo courses keep the original simulated
// processing animation, since there's no backend to actually store to.
function wireCourseUploadModal(course, onUploaded) {
  const modal = document.getElementById('course-upload-modal');
  const selectStep = document.getElementById('course-upload-step-select');
  const processingStep = document.getElementById('course-upload-step-processing');
  const doneBtn = document.getElementById('course-upload-done');
  const dropzone = document.getElementById('course-upload-dropzone');
  const filesListEl = document.getElementById('course-selected-files-list');
  const uploadStartBtn = document.getElementById('course-upload-start');
  const targetLabel = document.getElementById('course-upload-target-label');
  const processingListEl = document.getElementById('course-processing-files-list');
  if (!modal) return { open: () => {} };

  const isRealCourse = typeof isBackendId === 'function' && isBackendId(course.id);
  if (targetLabel) {
    targetLabel.textContent = `Uploading directly into ${course.title}. It'll show up here as soon as it's processed.`;
  }

  let selectedFiles = [];

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.multiple = true;
  fileInput.style.display = 'none';
  fileInput.accept = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.mp3,.m4a,.wav';
  document.body.appendChild(fileInput);

  function fmtSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function renderSelectedFiles() {
    uploadStartBtn.disabled = selectedFiles.length === 0;
    uploadStartBtn.textContent = selectedFiles.length > 1 ? `Upload ${selectedFiles.length} Files` : 'Upload';
    filesListEl.innerHTML = selectedFiles.map((f, i) => `
      <div class="list-item-card" style="padding:12px 16px; margin-bottom:8px;">
        <div>
          <div class="list-item-title" style="font-size:13.5px;">${f.name}</div>
          <div class="list-item-meta">${fmtSize(f.size)}</div>
        </div>
        <button type="button" class="material-menu-btn" data-remove="${i}">Remove</button>
      </div>
    `).join('');
    filesListEl.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectedFiles.splice(Number(btn.dataset.remove), 1);
        renderSelectedFiles();
      });
    });
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    selectedFiles = selectedFiles.concat(Array.from(fileInput.files));
    fileInput.value = '';
    renderSelectedFiles();
  });
  ['dragover', 'dragenter'].forEach((evt) => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--color-primary)'; }));
  ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.style.borderColor = ''; }));
  dropzone.addEventListener('drop', (e) => {
    selectedFiles = selectedFiles.concat(Array.from(e.dataTransfer.files));
    renderSelectedFiles();
  });

  function open() {
    selectedFiles = [];
    renderSelectedFiles();
    modal.classList.add('is-open');
    selectStep.style.display = 'block';
    processingStep.classList.remove('is-active');
    doneBtn.style.display = 'none';
  }
  function close() { modal.classList.remove('is-open'); }

  document.getElementById('course-upload-cancel').addEventListener('click', close);
  document.getElementById('course-upload-background')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

  // Uploads one already-picked file to the real backend and reflects the
  // result in its row. Reused by the initial upload pass and by the Retry
  // button. backend/app/routes/materials.py can return HTTP 200 with just
  // a failure message and no "material" key (e.g. course not found), so
  // success is decided by the presence of that key, not res.ok alone.
  async function uploadOneFile(i) {
    const f = selectedFiles[i];
    const statusEl = document.getElementById(`course-proc-status-${i}`);
    const iconEl = document.getElementById(`course-proc-icon-${i}`);
    statusEl.textContent = 'Uploading…';
    statusEl.style.color = '';
    iconEl.textContent = '⟳';
    try {
      const formData = new FormData();
      formData.append('course_id', course.id);
      formData.append('file', f);
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/upload`, {
        method: 'POST',
        body: formData,
      }, 30000);
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      if (!data || !data.material) throw new Error(data?.message || 'Backend did not return an uploaded material');
      statusEl.textContent = 'Ready';
      iconEl.textContent = '✓';
      return true;
    } catch (err) {
      console.warn('Sabilearn: material upload failed.', err);
      statusEl.textContent = "We couldn't process this material";
      statusEl.style.color = 'var(--color-warn-text)';
      iconEl.innerHTML = `<button class="btn btn-secondary btn-sm" data-retry="${i}">Retry</button>`;
      return false;
    }
  }

  // Delegated once — the processing list's innerHTML gets replaced on
  // every upload run, so a per-run listener would leak/duplicate.
  processingListEl?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-retry]');
    if (!btn) return;
    const ok = await uploadOneFile(Number(btn.dataset.retry));
    if (ok) await onUploaded();
  });

  uploadStartBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;

    selectStep.style.display = 'none';
    processingStep.classList.add('is-active');

    processingListEl.innerHTML = selectedFiles.map((f, i) => `
      <div class="list-item-card" style="padding:14px 16px; margin-bottom:8px;" id="course-proc-file-${i}">
        <div>
          <div class="list-item-title" style="font-size:13.5px;">${f.name}</div>
          <div class="list-item-meta" id="course-proc-status-${i}">Uploading…</div>
        </div>
        <span id="course-proc-icon-${i}">⟳</span>
      </div>
    `).join('');

    if (!isRealCourse) {
      // No real backend course — keep the original simulated upload flow,
      // then hand the picked files back so the workspace can reflect them.
      const stages = ['Reading your material', 'Preparing content', 'Making it searchable', 'Ready'];
      selectedFiles.forEach((f, i) => {
        const statusEl = document.getElementById(`course-proc-status-${i}`);
        const iconEl = document.getElementById(`course-proc-icon-${i}`);
        stages.forEach((stage, si) => {
          setTimeout(() => {
            statusEl.textContent = stage;
            if (stage === 'Ready') iconEl.textContent = '✓';
            if (i === selectedFiles.length - 1 && si === stages.length - 1) {
              doneBtn.style.display = 'inline-flex';
              onUploaded({ simulatedFiles: selectedFiles });
            }
          }, (i * 200) + (si + 1) * 450);
        });
      });
      return;
    }

    // Real backend course — upload each file straight to this course (no
    // redirect to Library), then refresh the materials grid in place.
    let anySucceeded = false;
    for (let i = 0; i < selectedFiles.length; i++) {
      const ok = await uploadOneFile(i);
      if (ok) anySucceeded = true;
    }
    doneBtn.style.display = 'inline-flex';
    if (anySucceeded) await onUploaded();
  });

  doneBtn.addEventListener('click', close);

  return { open };
}

// ---- Edit Course modal (Screen 30) ----
// { supported: false } is passed for real backend courses — the backend
// has no PATCH /courses/:id (only create/list/delete — see
// backend/app/routes/courses.py), so editing must say so honestly rather
// than pretending a save happened. Mock/demo courses keep working exactly
// as before.
function openEditCourseModal(course, { supported = true } = {}) {
  let host = document.getElementById('edit-course-modal');
  if (!host) {
    host = document.createElement('div');
    host.id = 'edit-course-modal';
    host.className = 'modal-overlay';
    document.body.appendChild(host);
  }
  host.innerHTML = `
    <div class="modal-card">
      <h3>Edit Course</h3>
      ${supported
        ? `<p class="sub">Editing a course does not affect its materials, quizzes, flashcards or progress.</p>`
        : `<p class="sub" style="color:var(--color-warn-text);">Not supported yet — the backend doesn't have a way to save course edits yet.</p>`}
      <div class="field"><label>Course Name</label><input type="text" id="edit-course-name" ${supported ? '' : 'disabled'}></div>
      <div class="field"><label>Description</label><input type="text" id="edit-course-desc" ${supported ? '' : 'disabled'}></div>
      ${supported ? `<div class="field"><label>Category</label><input type="text" id="edit-course-category" placeholder="e.g. Computer Science"></div>` : ''}
      <div class="modal-actions">
        <button class="btn btn-secondary" id="edit-course-cancel">${supported ? 'Cancel' : 'Close'}</button>
        ${supported ? `<button class="btn btn-primary" id="edit-course-save">Save Changes</button>` : ''}
      </div>
    </div>
  `;
  document.getElementById('edit-course-name').value = course.title;
  document.getElementById('edit-course-desc').value = course.description || '';
  const original = { name: course.title, desc: course.description || '' };
  host.classList.add('is-open');

  async function tryClose() {
    const changed = supported && (document.getElementById('edit-course-name').value !== original.name || document.getElementById('edit-course-desc').value !== original.desc);
    if (changed && !(await confirmDiscardChanges())) return;
    host.classList.remove('is-open');
  }
  document.getElementById('edit-course-cancel').onclick = tryClose;
  host.onclick = (e) => { if (e.target === host) tryClose(); };
  if (supported) {
    document.getElementById('edit-course-save').onclick = () => {
      document.getElementById('course-title').textContent = document.getElementById('edit-course-name').value;
      host.classList.remove('is-open');
    };
  }
}

// ---- Move Material modal (Screen 43) ----
function openMoveMaterialModal(material, currentCourse, allCourses) {
  let host = document.getElementById('move-material-modal');
  if (!host) {
    host = document.createElement('div');
    host.id = 'move-material-modal';
    host.className = 'modal-overlay';
    document.body.appendChild(host);
  }
  const options = allCourses.filter((c) => c.id !== currentCourse.id)
    .map((c) => `<option value="${c.id}">${c.title}</option>`).join('');
  host.innerHTML = `
    <div class="modal-card">
      <h3>Move Material</h3>
      <p class="sub">Current: ${currentCourse.title}</p>
      <div class="field">
        <label>Select destination</label>
        <select id="move-course-select" style="width:100%; padding:12px 14px; border:1px solid var(--color-border); border-radius:var(--radius-sm); background:var(--color-bg); font-size:14px;">${options}</select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="move-cancel">Cancel</button>
        <button class="btn btn-primary" id="move-confirm">Move Material</button>
      </div>
    </div>
  `;
  host.classList.add('is-open');
  document.getElementById('move-cancel').onclick = () => host.classList.remove('is-open');
  host.onclick = (e) => { if (e.target === host) host.classList.remove('is-open'); };
  document.getElementById('move-confirm').onclick = () => {
    // Kept mocked: the backend has no route to move a material between
    // courses yet.
    host.classList.remove('is-open');
    alert(`"${material.title}" moved successfully.`);
  };
}
