// SABILEARN — Onboarding wizard behavior
// NOTE: On completion this posts nothing yet — TODO: POST /onboarding/complete
// with the collected profile once the backend contract exists.

const state = {
  step: 1,
  totalSteps: 5,
  goals: new Set(),
  courses: [],
  methods: new Set(),
  studyTime: null,
};

function updateProgress() {
  document.querySelectorAll('.onboard-dot').forEach((dot, i) => {
    const stepNum = i + 1;
    dot.classList.toggle('is-active', stepNum === state.step);
    dot.classList.toggle('is-done', stepNum < state.step);
  });
}

function goToStep(n) {
  state.step = n;
  document.querySelectorAll('.onboard-step').forEach((el) => el.classList.remove('is-active'));
  document.getElementById(`onboard-step-${n}`).classList.add('is-active');
  updateProgress();
  if (n === 5) renderReview();
}

function toggleChip(chip, set, value) {
  chip.classList.toggle('is-selected');
  const input = chip.querySelector('input');
  input.checked = chip.classList.contains('is-selected');
  if (chip.classList.contains('is-selected')) {
    set.add(value);
  } else {
    set.delete(value);
  }
}

function renderCourseList() {
  const list = document.getElementById('course-list');
  list.innerHTML = '';
  state.courses.forEach((course, index) => {
    const row = document.createElement('div');
    row.className = 'course-row';
    row.innerHTML = `
      <span class="course-row-name">${course.name}</span>
      <button type="button" class="course-row-remove" data-index="${index}">Remove</button>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll('.course-row-remove').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.courses.splice(Number(btn.dataset.index), 1);
      renderCourseList();
    });
  });
}

function renderReview() {
  const goalsEl = document.getElementById('review-goals');
  goalsEl.innerHTML = [...state.goals].map((g) => `<span class="badge">${g}</span>`).join('') || '<span class="badge">None selected</span>';

  const coursesEl = document.getElementById('review-courses');
  coursesEl.innerHTML = state.courses.map((c) => `<span class="badge">${c.name}</span>`).join('') || '<span class="badge">None added</span>';

  const timeEl = document.getElementById('review-time');
  timeEl.innerHTML = `<span class="badge">${state.studyTime || 'Not set'}</span>`;

  const methodsEl = document.getElementById('review-methods');
  methodsEl.innerHTML = [...state.methods].map((m) => `<span class="badge">${m}</span>`).join('') || '<span class="badge">None selected</span>';
}

document.addEventListener('DOMContentLoaded', () => {
  updateProgress();

  // Step 1 — Welcome
  document.getElementById('welcome-continue').addEventListener('click', () => goToStep(2));

  // Step 2 — Goals
  document.querySelectorAll('#onboard-step-2 .option-chip').forEach((chip) => {
    chip.addEventListener('click', () => toggleChip(chip, state.goals, chip.dataset.value));
  });
  document.getElementById('goals-continue').addEventListener('click', () => goToStep(3));
  document.getElementById('goals-back').addEventListener('click', () => goToStep(1));

  // Step 3 — Courses
  const addCourseForm = document.getElementById('add-course-form');
  document.getElementById('show-add-course').addEventListener('click', () => {
    addCourseForm.classList.add('is-open');
  });
  document.getElementById('cancel-add-course').addEventListener('click', () => {
    addCourseForm.classList.remove('is-open');
    document.getElementById('course-name-input').value = '';
  });
  document.getElementById('save-course').addEventListener('click', () => {
    const nameInput = document.getElementById('course-name-input');
    const descInput = document.getElementById('course-desc-input');
    if (!nameInput.value.trim()) return;
    state.courses.push({ name: nameInput.value.trim(), description: descInput.value.trim() });
    nameInput.value = '';
    descInput.value = '';
    addCourseForm.classList.remove('is-open');
    document.getElementById('course-empty-note').classList.remove('is-visible');
    renderCourseList();
  });
  document.getElementById('courses-continue').addEventListener('click', () => {
    if (state.courses.length === 0) {
      document.getElementById('course-empty-note').classList.add('is-visible');
      return;
    }
    goToStep(4);
  });
  document.getElementById('courses-back').addEventListener('click', () => goToStep(2));

  // Step 4 — Study preferences
  document.querySelectorAll('#onboard-step-4 .option-chip[data-group="methods"]').forEach((chip) => {
    chip.addEventListener('click', () => toggleChip(chip, state.methods, chip.dataset.value));
  });
  document.querySelectorAll('.time-option').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.time-option').forEach((c) => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      state.studyTime = chip.dataset.value;
    });
  });
  document.getElementById('preferences-continue').addEventListener('click', () => goToStep(5));
  document.getElementById('preferences-back').addEventListener('click', () => goToStep(3));
  document.getElementById('preferences-skip').addEventListener('click', () => goToStep(5));

  // Step 5 — Review
  document.getElementById('review-back').addEventListener('click', () => goToStep(4));
  document.getElementById('start-learning').addEventListener('click', () => {
    const btn = document.getElementById('start-learning');
    btn.textContent = 'Setting up your learning space\u2026';
    btn.disabled = true;
    // TODO: replace with POST /onboarding/complete { goals, courses, methods, studyTime }
    setTimeout(() => {
      window.location.href = '../app/home.html';
    }, 700);
  });
});
