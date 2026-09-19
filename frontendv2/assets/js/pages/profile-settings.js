// SABILEARN — Profile & Settings behavior

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const user = await loadJSON('../../data/mock/user.json');

  document.getElementById('profile-avatar').textContent = (user.firstName[0] + user.lastName[0]).toUpperCase();
  document.getElementById('profile-name').textContent = `${user.firstName} ${user.lastName}`;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('prefs-goals').innerHTML = user.goals.map((g) => `<span class="badge">${g}</span>`).join('');
  document.getElementById('prefs-methods').innerHTML = user.methods.map((m) => `<span class="badge">${m}</span>`).join('');
  document.getElementById('prefs-time').textContent = user.studyTime;
  document.getElementById('password-last-changed').textContent = `Last changed: ${user.passwordLastChanged}`;

  // ---- Edit Profile ----
  const editForm = document.getElementById('edit-profile-form');
  const editView = document.getElementById('edit-profile-view');
  const normalView = document.getElementById('profile-normal-view');
  const original = { first: user.firstName, last: user.lastName, email: user.email };

  document.getElementById('edit-profile-btn').addEventListener('click', () => {
    document.getElementById('edit-first-name').value = user.firstName;
    document.getElementById('edit-last-name').value = user.lastName;
    document.getElementById('edit-email').value = user.email;
    normalView.style.display = 'none';
    editView.style.display = 'block';
  });

  async function cancelEdit() {
    const changed = document.getElementById('edit-first-name').value !== original.first
      || document.getElementById('edit-last-name').value !== original.last
      || document.getElementById('edit-email').value !== original.email;
    if (changed && !(await confirmDiscardChanges())) return;
    editView.style.display = 'none';
    normalView.style.display = 'block';
  }
  document.getElementById('cancel-edit-profile').addEventListener('click', cancelEdit);

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = editForm.querySelector('.auth-submit');
    const statusEl = document.getElementById('profile-save-status');
    btn.textContent = 'Saving changes\u2026';
    btn.disabled = true;
    statusEl.textContent = '';

    // TODO: replace with PATCH /account/profile { firstName, lastName, email }
    setTimeout(() => {
      const emailChanged = document.getElementById('edit-email').value !== original.email;
      document.getElementById('profile-name').textContent = `${document.getElementById('edit-first-name').value} ${document.getElementById('edit-last-name').value}`;
      document.getElementById('profile-avatar').textContent = (document.getElementById('edit-first-name').value[0] + document.getElementById('edit-last-name').value[0]).toUpperCase();
      if (!emailChanged) document.getElementById('profile-email').textContent = document.getElementById('edit-email').value;

      btn.textContent = 'Save Changes';
      btn.disabled = false;
      statusEl.textContent = emailChanged
        ? 'Profile updated. Check your inbox to verify your new email address.'
        : 'Profile updated successfully.';
      statusEl.style.color = 'var(--color-good-text)';
      setTimeout(() => { editView.style.display = 'none'; normalView.style.display = 'block'; }, 900);
    }, 700);
  });

  // ---- Log out ----
  document.getElementById('logout-btn').addEventListener('click', async () => {
    const ok = await sabilearnDialog({
      title: 'Log out of your account?',
      body: "You'll need to sign in again to access your learning space.",
      confirmLabel: 'Log Out',
      icon: '\u21B0',
    });
    if (ok) window.location.href = '../../auth/login.html';
  });
});
