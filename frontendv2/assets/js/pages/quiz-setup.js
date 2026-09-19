// SABILEARN — Quiz Setup behavior
// "Generate Quiz" now calls POST /quiz/ on the backend for real backend
// courses (backend/app/routes/quiz.py). The backend returns generated
// question data, but quiz-taking.html/quiz-engine.js only know how to play
// back the local mock quiz format today, so "Start Quiz" still opens the
// matching mock quiz — the generated backend quiz is logged to the console
// for now until the taking screen is updated to consume it directly.

const COURSE_QUIZ_MAP = {
  csc301: 'neural-networks-quiz',
  mth201: 'differential-equations-quiz',
  phy201: 'mechanics-quiz',
};

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const presetCourse = params.get('course');
  const presetMaterial = params.get('material');

  const [{ courses }, materialsData] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    loadJSON('../../data/mock/materials.json'),
  ]);

  // Real backend courses, so this page also works when arriving from a
  // course page backed by the FastAPI backend rather than a mock course.
  let backendCourses = [];
  try {
    const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/courses/`, {}, 8000);
    if (!res.ok) throw new Error(`Backend responded ${res.status}`);
    const data = await res.json();
    backendCourses = data.courses || [];
  } catch (err) {
    console.warn('Sabilearn: could not reach backend for course list.', err);
  }

  const state = {
    course: presetCourse || courses[0].id,
    source: presetMaterial ? 'material' : 'course',
    material: presetMaterial || null,
    topic: null,
    difficulty: 'Medium',
    count: 10,
    types: new Set(['mcq']),
    focus: 'all',
  };

  const mockOptions = courses.map((c) => `<option value="${c.id}" ${c.id === state.course ? 'selected' : ''}>${c.code} · ${c.title}</option>`).join('');
  const backendOptions = backendCourses.map((c) => `<option value="${c.id}" ${String(c.id) === String(state.course) ? 'selected' : ''}>${c.code ? `${c.code} · ` : ''}${c.name}</option>`).join('');
  document.getElementById('setup-course-select').innerHTML = mockOptions + backendOptions;

  function currentCourse() {
    const mock = courses.find((c) => c.id === state.course);
    if (mock) return mock;
    const backend = backendCourses.find((c) => String(c.id) === String(state.course));
    if (backend) return { id: String(backend.id), code: backend.code || 'COURSE', title: backend.name, topics: [] };
    return courses[0];
  }

  function renderSourceOptions() {
    const course = currentCourse();
    const wrap = document.getElementById('source-detail-wrap');
    if (state.source === 'topic') {
      if (!course.topics.length) {
        wrap.innerHTML = `<p style="color:var(--color-text-faint); font-size:13.5px;">No topics available for this course yet.</p>`;
        return;
      }
      wrap.innerHTML = `<select id="source-topic-select" style="width:100%; padding:11px 14px; border:1px solid var(--color-border); border-radius:var(--radius-sm); background:var(--color-bg); font-size:14px;">
        ${course.topics.map((t) => `<option ${t.name === state.topic ? 'selected' : ''}>${t.name}</option>`).join('')}
      </select>`;
      state.topic = state.topic || course.topics[0].name;
      document.getElementById('source-topic-select').addEventListener('change', (e) => state.topic = e.target.value);
    } else if (state.source === 'material') {
      const mats = materialsData[course.id] || [];
      wrap.innerHTML = `<select id="source-material-select" style="width:100%; padding:11px 14px; border:1px solid var(--color-border); border-radius:var(--radius-sm); background:var(--color-bg); font-size:14px;">
        ${mats.map((m) => `<option value="${m.id}" ${m.id === state.material ? 'selected' : ''}>${m.title}</option>`).join('')}
      </select>`;
      state.material = state.material || mats[0]?.id;
      document.getElementById('source-material-select').addEventListener('change', (e) => state.material = e.target.value);
    } else {
      wrap.innerHTML = '';
    }
  }

  function updateEstimate() {
    const perQuestion = state.types.has('short') ? 1.5 : 1;
    const minutes = Math.round(state.count * perQuestion);
    document.getElementById('estimate-text').textContent = `Estimated time: ${Math.max(3, minutes - 2)}–${minutes + 3} minutes`;
  }

  document.getElementById('setup-course-select').addEventListener('change', (e) => {
    state.course = e.target.value;
    state.topic = null; state.material = null;
    renderSourceOptions();
  });

  document.querySelectorAll('.source-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.source-chip').forEach((c) => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      state.source = chip.dataset.source;
      renderSourceOptions();
    });
  });

  document.querySelectorAll('.difficulty-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.difficulty-chip').forEach((c) => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      state.difficulty = chip.dataset.value;
    });
  });

  document.querySelectorAll('.count-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.count-chip').forEach((c) => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      state.count = Number(chip.dataset.value);
      updateEstimate();
    });
  });

  document.querySelectorAll('.type-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('is-selected');
      if (chip.classList.contains('is-selected')) state.types.add(chip.dataset.value);
      else state.types.delete(chip.dataset.value);
      if (state.types.size === 0) { chip.classList.add('is-selected'); state.types.add(chip.dataset.value); }
      updateEstimate();
    });
  });

  document.querySelectorAll('.focus-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.focus-chip').forEach((c) => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      state.focus = chip.dataset.value;
    });
  });

  document.getElementById('generate-quiz-btn').addEventListener('click', async () => {
    const btn = document.getElementById('generate-quiz-btn');
    btn.textContent = 'Creating your quiz\u2026';
    btn.disabled = true;

    let backendQuiz = null;
    if (typeof isBackendId === 'function' && isBackendId(state.course)) {
      try {
        const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/quiz/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: Number(state.course),
            topic: state.source === 'topic' ? state.topic : null,
            num_questions: state.count,
          }),
        });
        if (!res.ok) throw new Error(`Backend responded ${res.status}`);
        backendQuiz = await res.json();
        console.info('Sabilearn: backend generated this quiz (not yet playable in quiz-taking.html):', backendQuiz);
      } catch (err) {
        console.warn('Sabilearn: quiz generation backend call failed, using mock quiz for preview.', err);
      }
    }

    const quizData = await loadJSON('../../data/mock/quizzes.json');
    const quizId = COURSE_QUIZ_MAP[state.course] || quizData.quizzes[0].id;
    const quiz = quizData.quizzes.find((q) => q.id === quizId);
    const topicLabel = backendQuiz?.topic || state.topic || quiz.topic;

    document.getElementById('setup-view').style.display = 'none';
    const previewView = document.getElementById('preview-view');
    previewView.style.display = 'block';

    const typeLabels = { mcq: 'Multiple Choice', tf: 'True/False', short: 'Short Answer' };
    document.getElementById('preview-title-input').value = `${topicLabel} — Fundamentals`;
    document.getElementById('preview-meta').textContent = `${state.count} questions · ${state.difficulty} · ${[...state.types].map((t) => typeLabels[t]).join(' + ')}`;
    document.getElementById('preview-topics').innerHTML = `<span class="badge">${topicLabel}</span>` +
      currentCourse().topics.slice(0, 2).filter(t => t.name !== topicLabel).map((t) => `<span class="badge">${t.name}</span>`).join('');
    document.getElementById('preview-estimate').textContent = document.getElementById('estimate-text').textContent;

    document.getElementById('start-quiz-btn').onclick = () => {
      window.location.href = `quiz-taking.html?quiz=${quiz.id}&course=${state.course}`;
    };
  });

  renderSourceOptions();
  updateEstimate();
});
