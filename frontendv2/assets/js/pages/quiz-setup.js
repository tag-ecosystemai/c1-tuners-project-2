// SABILEARN — Quiz Setup behavior
// "Generate Quiz" calls POST /quiz/ on the backend for real backend courses
// (backend/app/routes/quiz.py). The backend-generated quiz is normalized
// (see generated-content-store.js) and cached locally, then "Start Quiz"
// opens quiz-taking.html pointed at that real generated quiz — no mock
// quiz is substituted for real backend courses. Mock/demo courses keep
// using the local mock quiz bank exactly as before.

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
  const backendCourses = await sabilearnGetBackendCourses();

  // Default to the first real backend course when one exists, so the page
  // favors real data over the mock/demo course list. A preset course from
  // the URL (e.g. arriving from a course workspace) always wins.
  const defaultCourse = presetCourse || (backendCourses.length ? String(backendCourses[0].id) : courses[0].id);

  const state = {
    course: defaultCourse,
    source: presetMaterial ? 'material' : 'course',
    material: presetMaterial || null,
    topic: null,
    difficulty: 'Medium',
    count: 10,
    types: new Set(['mcq']),
    focus: 'all',
  };

  // Backend courses are listed first so the default selection above lines
  // up with what's shown as selected in the dropdown.
  const backendOptions = backendCourses.map((c) => `<option value="${c.id}" ${String(c.id) === String(state.course) ? 'selected' : ''}>${c.code ? `${c.code} · ` : ''}${c.name}</option>`).join('');
  const mockOptions = courses.map((c) => `<option value="${c.id}" ${c.id === state.course ? 'selected' : ''}>${c.code} · ${c.title}</option>`).join('');
  document.getElementById('setup-course-select').innerHTML = backendOptions + mockOptions;

  // The backend's POST /quiz/ only accepts { course_id, topic,
  // num_questions } (see backend/app/routes/quiz.py) — it has no concept
  // of a specific material, difficulty, question type, or focus. For a
  // backend course we hide those options instead of letting the learner
  // configure something the generation call will silently ignore. Mock
  // courses keep every option exactly as before.
  function updateBackendOptionVisibility() {
    const isBackend = typeof isBackendId === 'function' && isBackendId(state.course);

    const materialChip = document.getElementById('source-chip-material');
    materialChip.disabled = isBackend;
    materialChip.classList.toggle('is-disabled', isBackend);
    document.getElementById('material-not-supported-note').style.display = isBackend ? 'block' : 'none';
    if (isBackend && state.source === 'material') {
      state.source = 'course';
      document.querySelectorAll('.source-chip').forEach((c) => c.classList.remove('is-selected'));
      document.querySelector('.source-chip[data-source="course"]').classList.add('is-selected');
    }

    ['difficulty-section', 'types-section', 'focus-section'].forEach((sectionId) => {
      document.getElementById(sectionId).querySelectorAll('.setup-chip').forEach((chip) => {
        chip.disabled = isBackend;
        chip.classList.toggle('is-disabled', isBackend);
      });
    });
    document.getElementById('difficulty-not-supported-note').style.display = isBackend ? 'block' : 'none';
    document.getElementById('types-not-supported-note').style.display = isBackend ? 'block' : 'none';
    document.getElementById('focus-not-supported-note').style.display = isBackend ? 'block' : 'none';
  }

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
    updateBackendOptionVisibility();
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

  function showSetupError(message, onRetry) {
    const banner = document.getElementById('setup-error-banner');
    banner.style.display = 'block';
    banner.innerHTML = `
      <div class="page-empty-state" style="padding:16px 0;">
        <p style="color:var(--color-warn-text); font-size:13.5px; margin-bottom:10px;">${sabilearnEscapeHtml(message)}</p>
        <button type="button" class="btn btn-secondary btn-sm" id="setup-error-retry">Retry</button>
      </div>
    `;
    document.getElementById('setup-error-retry').addEventListener('click', onRetry);
  }
  function clearSetupError() {
    const banner = document.getElementById('setup-error-banner');
    banner.style.display = 'none';
    banner.innerHTML = '';
  }

  async function generateQuiz() {
    clearSetupError();
    const btn = document.getElementById('generate-quiz-btn');
    btn.textContent = 'Creating your quiz\u2026';
    btn.disabled = true;

    const isRealCourse = typeof isBackendId === 'function' && isBackendId(state.course);
    let generatedQuiz = null;

    if (isRealCourse) {
      try {
        const res = await sabilearnFetch(`${window.SABILEARN_API_BASE}/quiz/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            course_id: Number(state.course),
            topic: state.source === 'topic' ? state.topic : null,
            num_questions: state.count,
          }),
        }, 60000);
        if (!res.ok) throw new Error(`Backend responded ${res.status}`);
        const backendQuiz = await res.json();
        const course = currentCourse();
        generatedQuiz = normalizeBackendQuiz(backendQuiz, {
          courseId: state.course,
          courseCode: course.code,
          courseTitle: course.title,
          topic: state.source === 'topic' ? state.topic : (backendQuiz.topic || null),
          difficulty: state.difficulty,
        });
        if (!generatedQuiz.questions.length) throw new Error('Backend returned no usable questions');
        saveGeneratedQuiz(generatedQuiz);
      } catch (err) {
        console.warn('Sabilearn: quiz generation backend call failed.', err);
        btn.textContent = '\u2726 Generate Quiz';
        btn.disabled = false;
        // Real backend course and the generation call failed — show an
        // error with Retry. Never fall back to a mock quiz for a real course.
        showSetupError("We couldn't generate a quiz from the backend right now.", generateQuiz);
        return;
      }
    }

    let quiz = generatedQuiz;
    if (!quiz) {
      // Mock/demo course — keep the original local mock quiz bank.
      const quizData = await loadJSON('../../data/mock/quizzes.json');
      const quizId = COURSE_QUIZ_MAP[state.course] || quizData.quizzes[0].id;
      quiz = quizData.quizzes.find((q) => q.id === quizId);
    }
    const topicLabel = quiz.topic;

    document.getElementById('setup-view').style.display = 'none';
    const previewView = document.getElementById('preview-view');
    previewView.style.display = 'block';

    const typeLabels = { mcq: 'Multiple Choice', tf: 'True/False', short: 'Short Answer' };
    document.getElementById('preview-title-input').value = generatedQuiz ? quiz.title : `${topicLabel} — Fundamentals`;
    // Difficulty/type chips are disabled (and ignored by the backend) for
    // real backend courses, so the preview only claims what actually
    // happened: the question count and topic.
    document.getElementById('preview-meta').textContent = generatedQuiz
      ? `${quiz.questions.length} question${quiz.questions.length === 1 ? '' : 's'} · ${topicLabel}`
      : `${quiz.questions.length} question${quiz.questions.length === 1 ? '' : 's'} · ${state.difficulty} · ${[...state.types].map((t) => typeLabels[t]).join(' + ')}`;
    document.getElementById('preview-topics').innerHTML = `<span class="badge">${topicLabel}</span>` +
      currentCourse().topics.slice(0, 2).filter(t => t.name !== topicLabel).map((t) => `<span class="badge">${t.name}</span>`).join('');
    document.getElementById('preview-estimate').textContent = document.getElementById('estimate-text').textContent;

    btn.textContent = '\u2726 Generate Quiz';
    btn.disabled = false;

    document.getElementById('start-quiz-btn').onclick = () => {
      window.location.href = `quiz-taking.html?quiz=${quiz.id}&course=${state.course}`;
    };
  }

  document.getElementById('generate-quiz-btn').addEventListener('click', generateQuiz);

  updateBackendOptionVisibility();
  renderSourceOptions();
  updateEstimate();
});
