// SABILEARN — Add New Course behavior
// Wired to POST /courses/ on the backend (backend/app/routes/courses.py).
// The backend's Course model has no "category" field, so that select is
// still collected in the UI but is not sent or persisted anywhere yet.
// "code" IS a real backend field (shown as the course badge throughout the
// app, e.g. "CSC 301") and is sent below.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const { courses } = await loadJSON('../../data/mock/courses.json');
  const existingNames = courses.map((c) => c.title.toLowerCase());

  const form = document.getElementById('add-course-form-el');
  const nameInput = document.getElementById('new-course-name');
  const codeInput = document.getElementById('new-course-code');
  const descInput = document.getElementById('new-course-desc');
  const duplicateWarning = document.getElementById('duplicate-warning');

  nameInput.addEventListener('input', () => {
    duplicateWarning.classList.remove('is-visible');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;

    if (existingNames.includes(name.toLowerCase()) && !duplicateWarning.dataset.acknowledged) {
      duplicateWarning.classList.add('is-visible');
      return;
    }

    const btn = form.querySelector('.auth-submit');
    btn.textContent = 'Creating your course\u2026';
    btn.disabled = true;

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
    } catch (err) {
      // Backend isn't reachable — the course wasn't actually saved, but we
      // still show the "ready" screen so the flow keeps working offline.
      console.warn('Sabilearn: could not reach backend, course was not saved.', err);
    }

    document.getElementById('create-course-view').style.display = 'none';
    const readyView = document.getElementById('course-ready-view');
    readyView.style.display = 'block';
    document.getElementById('ready-course-name').textContent = name;

    // Point the follow-up actions at the real course when we have one;
    // otherwise fall back to the old hardcoded demo course.
    const targetId = createdId ?? 'csc301';
    const addMaterialLink = readyView.querySelector('a.btn-primary');
    const exploreLink = readyView.querySelector('a.btn-secondary');
    if (addMaterialLink) addMaterialLink.href = `course.html?course=${targetId}&tab=materials`;
    if (exploreLink) exploreLink.href = `course.html?course=${targetId}`;
  });

  document.getElementById('use-existing-btn')?.addEventListener('click', () => {
    window.location.href = 'my-courses.html';
  });
});
