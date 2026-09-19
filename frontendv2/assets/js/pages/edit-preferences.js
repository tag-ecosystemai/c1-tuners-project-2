// SABILEARN — Edit Learning Preferences behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const user = await loadJSON('../../data/mock/user.json');
  const original = JSON.stringify({ goals: user.goals, methods: user.methods, time: user.studyTime });

  document.querySelectorAll('.option-chip[data-group="goals"]').forEach((chip) => {
    if (user.goals.includes(chip.dataset.value)) { chip.classList.add('is-selected'); chip.querySelector('input').checked = true; }
    chip.addEventListener('click', () => {
      chip.classList.toggle('is-selected');
      chip.querySelector('input').checked = chip.classList.contains('is-selected');
    });
  });

  document.querySelectorAll('.option-chip[data-group="methods"]').forEach((chip) => {
    if (user.methods.includes(chip.dataset.value)) { chip.classList.add('is-selected'); chip.querySelector('input').checked = true; }
    chip.addEventListener('click', () => {
      chip.classList.toggle('is-selected');
      chip.querySelector('input').checked = chip.classList.contains('is-selected');
    });
  });

  document.querySelectorAll('.time-option').forEach((chip) => {
    if (chip.dataset.value === user.studyTime) chip.classList.add('is-selected');
    chip.addEventListener('click', () => {
      document.querySelectorAll('.time-option').forEach((c) => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
    });
  });

  function currentState() {
    const goals = [...document.querySelectorAll('.option-chip[data-group="goals"].is-selected')].map((c) => c.dataset.value);
    const methods = [...document.querySelectorAll('.option-chip[data-group="methods"].is-selected')].map((c) => c.dataset.value);
    const time = document.querySelector('.time-option.is-selected')?.dataset.value || '';
    return JSON.stringify({ goals, methods, time });
  }

  async function tryLeave(href) {
    if (currentState() !== original && !(await confirmDiscardChanges())) return;
    window.location.href = href;
  }
  document.getElementById('cancel-btn').addEventListener('click', (e) => { e.preventDefault(); tryLeave('profile-settings.html'); });

  document.getElementById('save-preferences-btn').addEventListener('click', () => {
    const btn = document.getElementById('save-preferences-btn');
    btn.textContent = 'Saving\u2026';
    btn.disabled = true;
    // TODO: PATCH /account/preferences { goals, methods, studyTime }
    setTimeout(() => { window.location.href = 'profile-settings.html'; }, 600);
  });
});
