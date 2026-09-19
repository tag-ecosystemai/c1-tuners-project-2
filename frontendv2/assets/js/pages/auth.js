// SABILEARN — Auth screens behavior
// NOTE: Actual account creation/login calls are stubbed until the backend
// contract exists (see docs/api-contract.md). Each TODO marks where a
// real fetch() to the API should replace the mock.

function toggleFieldError(fieldEl, message) {
  const errorEl = fieldEl.querySelector('.field-error');
  if (message) {
    fieldEl.classList.add('is-invalid');
    if (errorEl) errorEl.textContent = message;
  } else {
    fieldEl.classList.remove('is-invalid');
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setLoading(button, loadingText) {
  button.dataset.originalText = button.textContent;
  button.textContent = loadingText;
  button.disabled = true;
}

function clearLoading(button) {
  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
}

function wireVisibilityToggles(scope) {
  scope.querySelectorAll('.field-toggle-visibility').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.field-input-wrap').querySelector('input');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.textContent = isPassword ? 'Hide' : 'Show';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  wireVisibilityToggles(document);

  /* ---------------- SIGN UP ---------------- */
  const signupForm = document.querySelector('#signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const name = signupForm.querySelector('#name');
      const email = signupForm.querySelector('#email');
      const password = signupForm.querySelector('#password');
      const confirm = signupForm.querySelector('#confirm-password');

      toggleFieldError(name.closest('.field'), null);
      toggleFieldError(email.closest('.field'), null);
      toggleFieldError(password.closest('.field'), null);
      toggleFieldError(confirm.closest('.field'), null);

      if (!name.value.trim()) {
        toggleFieldError(name.closest('.field'), 'Enter your full name.');
        valid = false;
      }
      if (!isValidEmail(email.value.trim())) {
        toggleFieldError(email.closest('.field'), 'Enter a valid email address.');
        valid = false;
      }
      if (password.value.length < 8) {
        toggleFieldError(password.closest('.field'), 'Password must be at least 8 characters.');
        valid = false;
      }
      if (confirm.value !== password.value || !confirm.value) {
        toggleFieldError(confirm.closest('.field'), 'Passwords don\u2019t match.');
        valid = false;
      }

      if (!valid) return;

      const submitBtn = signupForm.querySelector('.auth-submit');
      setLoading(submitBtn, 'Creating account\u2026');

      // TODO: replace with POST /auth/signup { name, email, password }
      setTimeout(() => {
        window.location.href = '../onboarding/onboarding.html';
      }, 700);
    });
  }

  /* ---------------- LOGIN ---------------- */
  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const email = loginForm.querySelector('#email');
      const password = loginForm.querySelector('#password');
      const formError = document.querySelector('.auth-form-error');
      formError?.classList.remove('is-visible');

      toggleFieldError(email.closest('.field'), null);
      toggleFieldError(password.closest('.field'), null);

      if (!isValidEmail(email.value.trim())) {
        toggleFieldError(email.closest('.field'), 'Enter a valid email address.');
        valid = false;
      }
      if (!password.value) {
        toggleFieldError(password.closest('.field'), 'Enter your password.');
        valid = false;
      }

      if (!valid) return;

      const submitBtn = loginForm.querySelector('.auth-submit');
      setLoading(submitBtn, 'Logging in\u2026');

      // TODO: replace with POST /auth/login { email, password }
      // On success, check onboarding_complete before deciding the redirect below.
      setTimeout(() => {
        window.location.href = '../app/home.html';
      }, 700);
    });
  }

  /* ---------------- FORGOT PASSWORD (3 steps) ---------------- */
  const forgotForm = document.querySelector('#forgot-email-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = forgotForm.querySelector('#email');
      toggleFieldError(email.closest('.field'), null);

      if (!isValidEmail(email.value.trim())) {
        toggleFieldError(email.closest('.field'), 'Enter a valid email address.');
        return;
      }

      const submitBtn = forgotForm.querySelector('.auth-submit');
      setLoading(submitBtn, 'Sending\u2026');

      // TODO: replace with POST /auth/forgot-password { email }
      setTimeout(() => {
        clearLoading(submitBtn);
        goToStep('step-email-sent');
      }, 600);
    });
  }

  const resetForm = document.querySelector('#reset-password-form');
  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      const password = resetForm.querySelector('#new-password');
      const confirm = resetForm.querySelector('#confirm-new-password');

      toggleFieldError(password.closest('.field'), null);
      toggleFieldError(confirm.closest('.field'), null);

      if (password.value.length < 8) {
        toggleFieldError(password.closest('.field'), 'Password must be at least 8 characters.');
        valid = false;
      }
      if (confirm.value !== password.value || !confirm.value) {
        toggleFieldError(confirm.closest('.field'), 'Passwords don\u2019t match.');
        valid = false;
      }
      if (!valid) return;

      const submitBtn = resetForm.querySelector('.auth-submit');
      setLoading(submitBtn, 'Resetting\u2026');

      // TODO: replace with POST /auth/reset-password { token, password }
      setTimeout(() => {
        goToStep('step-reset-success');
      }, 600);
    });
  }
});

function goToStep(stepId) {
  document.querySelectorAll('.auth-step').forEach((step) => step.classList.remove('is-active'));
  document.getElementById(stepId)?.classList.add('is-active');
}
