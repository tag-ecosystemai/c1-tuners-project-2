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

  let course;
  let materials;
  if (typeof isBackendId === 'function' && isBackendId(courseId)) {
    try {
      ({ course, materials } = await loadBackendCourse(courseId));
    } catch (err) {
      console.warn('Sabilearn: could not load course from backend, falling back to mock course.', err);
    }
  }
  if (!course) {
    course = courses.find((c) => c.id === courseId) || courses[0];
    materials = materialsData[course.id] || [];
  }

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
  document.getElementById('menu-add-material').addEventListener('click', () => document.querySelector('.workspace-tab[data-tab="materials"]').click());
  document.getElementById('menu-edit-course').addEventListener('click', () => openEditCourseModal(course));
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
  if (materials.length === 0) {
    document.getElementById('materials-grid').innerHTML = `
      <div class="empty-course-block" style="grid-column:1/-1;">
        <div class="icon">📁</div>
        <h3>No materials yet</h3>
        <p>Add your notes, slides, documents or recordings to start learning with AI.</p>
        <button class="btn btn-primary" id="empty-add-material">+ Add Material</button>
      </div>
    `;
  } else {
    document.getElementById('materials-grid').innerHTML = materials.map((m, i) => `
      <div class="card material-card">
        <div class="material-icon">${MATERIAL_ICONS[m.type] || '\u{1F4C4}'}</div>
        <div class="material-card-body">
          <div class="material-card-title">${m.title}</div>
          <div class="material-card-meta">${m.ext} · ${m.size} · ${m.date}</div>
        </div>
        <button class="material-menu-btn" data-mi="${i}">⋯</button>
        <div class="material-menu-dropdown" id="material-menu-${i}">
          ${materialActions.map((a) => `<button data-action="${a}" data-mi="${i}">${a}</button>`).join('')}
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
        const m = materials[Number(btn.dataset.mi)];
        if (btn.dataset.action === 'Open') {
          window.location.href = `../library/material-viewer.html?material=${m.id}&course=${course.id}`;
        } else if (btn.dataset.action === 'Generate Quiz') {
          window.location.href = `../quizzes/quiz-setup.html?course=${course.id}&material=${m.id}`;
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
  document.getElementById('empty-add-material')?.addEventListener('click', () => alert('Opens the Upload Material flow (see Library).'));

  // ---- AI Tutor tab ----
  const courseQuizzes = quizData.quizzes.filter((q) => q.courseId === course.id);
  const courseDecks = flashcardData.decks.filter((d) => d.courseId === course.id);
  initAiTutor(document.getElementById('tutor-pane-root'), {
    courseId: course.id,
    courseCode: course.code,
    courseTitle: course.title,
    quizLink: courseQuizzes[0] ? `../quizzes/quiz-taking.html?quiz=${courseQuizzes[0].id}&course=${course.id}` : null,
    flashcardLink: courseDecks[0] ? `../flashcards/flashcard-study.html?deck=${courseDecks[0].id}&course=${course.id}` : null,
  });

  // ---- Quizzes tab ----
  document.getElementById('quizzes-list').innerHTML = `
    <div class="materials-toolbar">
      <div><h3>Quizzes</h3><p>Only quizzes belonging to this course.</p></div>
      <a href="../quizzes/quiz-setup.html?course=${course.id}" class="btn btn-primary btn-sm">+ Generate Quiz</a>
    </div>
  ` + (courseQuizzes.length ? courseQuizzes.map((q) => {
    const hist = quizData.history.find((h) => h.quizId === q.id);
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
  document.getElementById('flashcards-list').innerHTML = `
    <div class="materials-toolbar">
      <div><h3>Flashcards</h3><p>Only flashcards belonging to this course.</p></div>
      <a href="../flashcards/flashcards.html" class="btn btn-primary btn-sm">+ Create Deck</a>
    </div>
  ` + (courseDecks.length ? courseDecks.map((d) => `
    <a href="../flashcards/deck-details.html?deck=${d.id}" class="card list-item-card" style="display:flex;">
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
      <a href="../flashcards/flashcards.html" class="btn btn-primary">Create Flashcards</a>
    </div>
  `);

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

// ---- Edit Course modal (Screen 30) ----
function openEditCourseModal(course) {
  let host = document.getElementById('edit-course-modal');
  if (!host) {
    host = document.createElement('div');
    host.id = 'edit-course-modal';
    host.className = 'modal-overlay';
    host.innerHTML = `
      <div class="modal-card">
        <h3>Edit Course</h3>
        <p class="sub">Editing a course does not affect its materials, quizzes, flashcards or progress.</p>
        <div class="field"><label>Course Name</label><input type="text" id="edit-course-name"></div>
        <div class="field"><label>Description</label><input type="text" id="edit-course-desc"></div>
        <div class="field"><label>Category</label><input type="text" id="edit-course-category" placeholder="e.g. Computer Science"></div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="edit-course-cancel">Cancel</button>
          <button class="btn btn-primary" id="edit-course-save">Save Changes</button>
        </div>
      </div>
    `;
    document.body.appendChild(host);
  }
  document.getElementById('edit-course-name').value = course.title;
  document.getElementById('edit-course-desc').value = course.description || '';
  const original = { name: course.title, desc: course.description || '' };
  host.classList.add('is-open');

  async function tryClose() {
    const changed = document.getElementById('edit-course-name').value !== original.name || document.getElementById('edit-course-desc').value !== original.desc;
    if (changed && !(await confirmDiscardChanges())) return;
    host.classList.remove('is-open');
  }
  document.getElementById('edit-course-cancel').onclick = tryClose;
  host.onclick = (e) => { if (e.target === host) tryClose(); };
  document.getElementById('edit-course-save').onclick = () => {
    // Kept mocked: the backend has no PATCH /courses/:id route yet, only
    // create (POST), list (GET) and delete (DELETE).
    document.getElementById('course-title').textContent = document.getElementById('edit-course-name').value;
    host.classList.remove('is-open');
  };
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
