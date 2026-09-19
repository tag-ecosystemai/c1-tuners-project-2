// SABILEARN — Delete Account behavior

document.addEventListener('sabilearn:shell-ready', () => {
  const input = document.getElementById('delete-confirm-input');
  const btn = document.getElementById('delete-account-btn');

  input.addEventListener('input', () => {
    btn.disabled = input.value.trim() !== 'DELETE';
  });

  btn.addEventListener('click', () => {
    btn.textContent = 'Deleting your account\u2026';
    btn.disabled = true;
    // TODO: replace with DELETE /account
    setTimeout(() => {
      window.location.href = '../../index.html';
    }, 900);
  });
});
