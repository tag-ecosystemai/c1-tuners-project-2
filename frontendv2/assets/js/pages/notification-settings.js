// SABILEARN — Notification Settings behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const user = await loadJSON('../../data/mock/user.json');
  const prefs = user.notificationPrefs;

  document.querySelectorAll('.toggle-switch').forEach((toggle) => {
    const key = toggle.dataset.pref;
    if (prefs[key]) toggle.classList.add('is-on');
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('is-on');
      // TODO: PATCH /account/notification-preferences { [key]: newValue }
    });
  });

  document.getElementById('reminder-time').value = prefs.reminderTime;
});
