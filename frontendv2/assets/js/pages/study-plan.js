// SABILEARN — Study Plan behavior

const TASK_ICONS = { review: '\u{1F4A1}', quiz: '\u2756', flashcards: '\u23F1' };

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function renderToday(tasks) {
  const doneCount = tasks.filter((t) => t.done).length;
  document.getElementById('plan-progress-label').textContent = `${doneCount} of ${tasks.length} tasks completed`;
  document.getElementById('plan-progress-fill').style.width = `${(doneCount / tasks.length) * 100}%`;

  document.getElementById('plan-today').innerHTML = tasks.map((t, i) => `
    <div class="card plan-task-row ${t.done ? 'is-done' : ''}" data-index="${i}" style="align-items:flex-start;">
      <span class="plan-task-check">✓</span>
      <span class="plan-task-icon">${TASK_ICONS[t.type] || '\u2726'}</span>
      <div class="plan-task-body">
        <div class="plan-task-title">${t.title}</div>
        <div class="plan-task-meta">${t.duration} · ${t.course}</div>
        <p class="plan-task-reason">${t.reason}</p>
        <div class="plan-task-actions">
          <a href="${t.link}" class="btn btn-primary btn-sm">Start</a>
          <button class="btn btn-secondary btn-sm" data-reschedule="${i}">Reschedule</button>
          <button class="btn btn-secondary btn-sm" data-skip="${i}">Skip</button>
        </div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('#plan-today .plan-task-check').forEach((check) => {
    check.addEventListener('click', () => {
      check.closest('.plan-task-row').classList.toggle('is-done');
      const doneNow = document.querySelectorAll('#plan-today .plan-task-row.is-done').length;
      document.getElementById('plan-progress-label').textContent = `${doneNow} of ${tasks.length} tasks completed`;
      document.getElementById('plan-progress-fill').style.width = `${(doneNow / tasks.length) * 100}%`;
      // TODO: PATCH /study-plan/tasks/:id { done }
    });
  });
  document.querySelectorAll('[data-reschedule]').forEach((btn) => {
    btn.addEventListener('click', () => alert('Task moved to tomorrow\u2019s plan.'));
  });
  document.querySelectorAll('[data-skip]').forEach((btn) => {
    btn.addEventListener('click', () => { btn.closest('.plan-task-row').style.opacity = '0.4'; });
  });
}

function renderList(containerId, tasks, dayKey) {
  document.getElementById(containerId).innerHTML = tasks.map((t) => `
    <div class="card plan-task-row">
      <span class="plan-task-icon">\u2726</span>
      <div class="plan-task-body">
        <div class="plan-task-title">${t.title}</div>
        <div class="plan-task-meta">${t.duration} · ${t.course}</div>
      </div>
      <span class="plan-task-day">${t[dayKey]}</span>
    </div>
  `).join('');
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const plan = await loadJSON('../../data/mock/study-plan.json');
  renderToday(plan.today);
  renderList('plan-week', plan.thisWeek, 'day');
  renderList('plan-upcoming', plan.upcoming, 'day');

  document.querySelectorAll('.plan-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.plan-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.querySelectorAll('.plan-section').forEach((s) => s.style.display = 'none');
      document.getElementById(`section-${tab.dataset.section}`).style.display = 'block';
    });
  });
});
