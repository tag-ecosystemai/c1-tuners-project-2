// SABILEARN — shared dialog engine
// Injects a single dialog host into the page and exposes window.sabilearnDialog
// for confirm-style modals (neutral or danger), used by course/material/account actions.

(function () {
  function ensureHost() {
    let host = document.getElementById('sabilearn-dialog-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'sabilearn-dialog-host';
      host.className = 'modal-overlay';
      host.innerHTML = `
        <div class="modal-card dialog-card">
          <div class="dialog-icon" id="dialog-icon"></div>
          <h3 id="dialog-title"></h3>
          <p class="sub" id="dialog-body"></p>
          <div id="dialog-affected" class="dialog-affected" style="display:none;"></div>
          <div class="modal-actions" id="dialog-actions"></div>
        </div>
      `;
      document.body.appendChild(host);
    }
    return host;
  }

  window.sabilearnDialog = function ({ title, body, affected, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, icon = '!' }) {
    return new Promise((resolve) => {
      const host = ensureHost();
      host.querySelector('#dialog-title').textContent = title;
      host.querySelector('#dialog-body').textContent = body;
      const iconEl = host.querySelector('#dialog-icon');
      iconEl.textContent = icon;
      iconEl.className = `dialog-icon ${danger ? 'is-danger' : ''}`;

      const affectedEl = host.querySelector('#dialog-affected');
      if (affected && affected.length) {
        affectedEl.style.display = 'block';
        affectedEl.innerHTML = affected.map((a) => `<li>${a}</li>`).join('');
        affectedEl.innerHTML = `<ul>${affectedEl.innerHTML}</ul>`;
      } else {
        affectedEl.style.display = 'none';
      }

      host.querySelector('#dialog-actions').innerHTML = `
        <button class="btn btn-secondary" id="dialog-cancel">${cancelLabel}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="dialog-confirm">${confirmLabel}</button>
      `;

      host.classList.add('is-open');
      const close = (result) => { host.classList.remove('is-open'); resolve(result); };
      host.querySelector('#dialog-cancel').onclick = () => close(false);
      host.querySelector('#dialog-confirm').onclick = () => close(true);
      host.onclick = (e) => { if (e.target === host) close(false); };
    });
  };

  // Unsaved-changes guard: call sabilearnDialog directly with this preset
  window.confirmDiscardChanges = function () {
    return window.sabilearnDialog({
      title: 'Discard your changes?',
      body: 'You have unsaved changes that will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep Editing',
      danger: true,
      icon: '!',
    });
  };

  // Session Expired (Screen 38) — non-dismissible, single action back to Login.
  // Not actively triggered without real auth/session logic; ready to call once
  // an API request returns 401.
  window.showSessionExpired = function () {
    const host = ensureHost();
    host.querySelector('#dialog-icon').className = 'dialog-icon is-danger';
    host.querySelector('#dialog-icon').textContent = '\u23F1';
    host.querySelector('#dialog-title').textContent = 'Your session has expired';
    host.querySelector('#dialog-body').textContent = 'For your security, please log in again to continue.';
    host.querySelector('#dialog-affected').style.display = 'none';
    host.querySelector('#dialog-actions').innerHTML = `<button class="btn btn-primary" id="dialog-confirm">Log In Again</button>`;
    host.classList.add('is-open');
    host.onclick = null;
    host.querySelector('#dialog-confirm').onclick = () => { window.location.href = `${window.SITE_ROOT || './'}auth/login.html`; };
  };
})();
