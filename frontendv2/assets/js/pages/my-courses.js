// SABILEARN — My Courses list behavior
// Merges real backend courses (GET /courses/, materials count from GET
// /materials/course/:id) with the local mock/demo courses, so this page
// reflects whatever courses actually exist on the backend instead of only
// the seeded demo set. Archiving stays a local (sessionStorage) UI concept
// for both, since the backend has no archived/active flag.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

async function loadBackendCourses() {
  const backendCourses = await sabilearnGetBackendCourses();
  return Promise.all(backendCourses.map(async (c) => {
    let materialsCount = 0;
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/materials/course/${c.id}`, {}, 8000);
      if (res.ok) {
        const data = await res.json();
        materialsCount = (data.materials || []).length;
      }
    } catch (err) {
      console.warn('Sabilearn: could not load materials count for course', c.id, err);
    }
    return sabilearnBackendCourseToUi(c, materialsCount);
  }));
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const [{ courses: mockCourses }, backendCourses] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    loadBackendCourses(),
  ]);
  const courses = mockCourses.concat(backendCourses);

  const archivedIds = JSON.parse(sessionStorage.getItem('archivedCourses') || '[]');
  const activeCourses = courses.filter((c) => !archivedIds.includes(c.id));
  const archivedCourses = courses.filter((c) => archivedIds.includes(c.id));
  const wrap = document.getElementById('course-grid');

  if (activeCourses.length === 0) {
    wrap.innerHTML = `
      <div class="page-empty-state" style="grid-column:1/-1;">
        <div class="icon">▥</div>
        <h3>No courses yet</h3>
        <p>Add your first course to start building your personal learning space.</p>
        <a href="add-course.html" class="btn btn-primary">+ Add Course</a>
      </div>
    `;
  } else {
    wrap.innerHTML = activeCourses.map((c) => `
      <a href="course.html?course=${c.id}" class="card course-card" style="display:block;">
        <div class="folder-card-top">
          <div class="folder-icon folder-icon-${c.color}">📘</div>
          <span class="folder-materials-count">${c.materialsCount} materials</span>
        </div>
        <span class="badge">${c.code}</span>
        <h4>${c.title}</h4>
        <div class="instructor">${c.instructor}</div>
        <div class="course-card-progress">
          <div class="course-card-progress-top"><span>Overall progress</span><span>${c.progress}%</span></div>
          <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${c.progress}%"></div></div>
        </div>
      </a>
    `).join('');
  }

  const archivedSection = document.getElementById('archived-section');
  if (archivedCourses.length) {
    archivedSection.style.display = 'block';
    document.getElementById('archived-toggle').textContent = `Archived Courses (${archivedCourses.length})`;
    document.getElementById('archived-list').innerHTML = archivedCourses.map((c) => `
      <div class="card list-item-card">
        <div>
          <div class="list-item-title">${c.title}</div>
          <div class="list-item-meta">${c.code} · Archived</div>
        </div>
        <button class="btn btn-secondary btn-sm" data-restore="${c.id}">Restore Course</button>
      </div>
    `).join('');
    document.querySelectorAll('[data-restore]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ids = JSON.parse(sessionStorage.getItem('archivedCourses') || '[]').filter((id) => id !== btn.dataset.restore);
        sessionStorage.setItem('archivedCourses', JSON.stringify(ids));
        window.location.reload();
      });
    });
  } else {
    archivedSection.style.display = 'none';
  }
});
