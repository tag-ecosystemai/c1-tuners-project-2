// SABILEARN — My Courses list behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const { courses } = await loadJSON('../../data/mock/courses.json');
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
