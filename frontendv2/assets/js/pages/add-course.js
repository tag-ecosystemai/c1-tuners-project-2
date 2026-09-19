// SABILEARN — Add New Course behavior
// Wired to POST /courses/ on the backend (backend/app/routes/courses.py).
// The backend's Course model has no "category" field, so that select is
// still collected in the UI but is not sent or persisted anywhere yet.
// "code" IS a real backend field (shown as the course badge throughout the
// app, e.g. "CSC 301") and is sent below.
//
// If the backend can't save the course, this page says so and stays on the
// form. It never shows the "course is ready" screen for a course that
// wasn't actually created.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  // Duplicate check covers the demo courses and the real backend courses.
  const [{ courses }, backendCourses] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    sabilearnGetBackendCourses(),
  ]);
  const existingNames = courses.map((c) => c.title.toLowerCase())
    .concat(backendCourses.map((c) => String(c.name || '').toLowerCase()));

  const form = document.getElementById('add-course-form-el');
  const nameInput = document.getElementById('new-course-name');
  const codeInput = document.getElementById('new-course-code');
  const descInput = document.getElementById('new-course-desc');
  const duplicateWarning = document.getElementById('duplicate-warning');
  const submitBtn = form.querySelector('.auth-submit');

  // Inline error shown above the submit button when the save fails.
  const errorEl = document.createElement('div');
  errorEl.className = 'tutor-error-card';
  errorEl.style.display = 'none';
  submitBtn.parentNode.insertBefore(errorEl, submitBtn);

  function showError(message) {
    errorEl.textContent = `⚠ ${message}`;
    errorEl.style.display = 'block';
  }
  function clearError() {
    errorEl.style.display = 'none';
  }

  nameInput.addEventListener('input', () => {
    duplicateWarning.classList.remove('is-visible');
    clearError();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const name = nameInput.value.trim();
    if (!name) return;

    if (existingNames.includes(name.toLowerCase()) && !duplicateWarning.dataset.acknowledged) {
      duplicateWarning.classList.add('is-visible');
      return;
    }

    submitBtn.textContent = 'Creating your course\u2026';
    submitBtn.disabled = true;

    let createdId = null;
    try {
      const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/courses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code: codeInput.value.trim() || null,
          description: descInput.value.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(`Backend responded ${res.status}`);
      const data = await res.json();
      createdId = data.course?.id ?? null;
      if (createdId === null) throw new Error('Backend did not return the created course');
    } catch (err) {
      console.warn('Sabilearn: course was not saved.', err);
      submitBtn.textContent = 'Create Course';
      submitBtn.disabled = false;
      showError("We couldn't create this course. Check that the backend is running and try again.");
      return;
    }

    document.getElementById('create-course-view').style.display = 'none';
    const readyView = document.getElementById('course-ready-view');
    readyView.style.display = 'block';
    document.getElementById('ready-course-name').textContent = name;

    // Point the follow-up actions at the course that was just created.
    const addMaterialLink = readyView.querySelector('a.btn-primary');
    const exploreLink = readyView.querySelector('a.btn-secondary');
    if (addMaterialLink) addMaterialLink.href = `course.html?course=${createdId}&tab=materials`;
    if (exploreLink) exploreLink.href = `course.html?course=${createdId}`;
  });

  document.getElementById('use-existing-btn')?.addEventListener('click', () => {
    window.location.href = 'my-courses.html';
  });
});
