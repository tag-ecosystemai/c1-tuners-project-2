// SABILEARN — Change Password behavior

document.addEventListener('sabilearn:shell-ready', () => {
  const form = document.getElementById('change-password-form');
  const strengthEl = document.getElementById('password-strength');

  function toggleFieldError(fieldEl, message) {
    const errorEl = fieldEl.querySelector('.field-error');
    if (message) { fieldEl.classList.add('is-invalid'); if (errorEl) errorEl.textContent = message; }
    else fieldEl.classList.remove('is-invalid');
  }

  document.getElementById('new-password').addEventListener('input', (e) => {
    const v = e.target.value;
    let strength = 'Weak', color = 'var(--color-warn-text)';
    if (v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v)) { strength = 'Strong'; color = 'var(--color-good-text)'; }
    else if (v.length >= 8) { strength = 'Medium'; color = 'var(--color-text-muted)'; }
    strengthEl.textContent = v ? `Password strength: ${strength}` : '';
    strengthEl.style.color = color;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    const current = document.getElementById('current-password');
    const next = document.getElementById('new-password');
    const confirm = document.getElementById('confirm-new-password');

    [current, next, confirm].forEach((f) => toggleFieldError(f.closest('.field'), null));

    if (!current.value) { toggleFieldError(current.closest('.field'), 'Enter your current password.'); valid = false; }
    if (next.value.length < 8) { toggleFieldError(next.closest('.field'), 'Password must be at least 8 characters.'); valid = false; }
    if (confirm.value !== next.value || !confirm.value) { toggleFieldError(confirm.closest('.field'), 'Passwords don\u2019t match.'); valid = false; }
    if (!valid) return;

    const btn = form.querySelector('.auth-submit');
    btn.textContent = 'Updating password\u2026';
    btn.disabled = true;

    // TODO: replace with POST /account/change-password { current, new }
    // On a real backend, an incorrect current password returns an error here —
    // surface it with toggleFieldError(current.closest('.field'), 'Current password is incorrect.')
    setTimeout(() => {
      document.getElementById('change-password-view').style.display = 'none';
      document.getElementById('password-success-view').style.display = 'block';
    }, 700);
  });
});
