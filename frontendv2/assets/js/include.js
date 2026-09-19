// SABILEARN — include.js
// Injects components/sidebar.html and components/topbar.html into any page
// with <div data-include="sidebar"></div> / <div data-include="topbar"></div>.
//
// Each page must set window.SITE_ROOT (path back to the project root) and
// window.APP_ROOT (path back to the /app/ folder) BEFORE this script runs.

(function () {
  // fetch() cannot load local files over the file:// protocol (browser
  // security restriction) — if the project was opened by double-clicking
  // index.html instead of via a local server, every fetch() call below will
  // silently fail and the whole page will look broken (no sidebar, no data,
  // no working buttons). Catch that case immediately and explain it clearly
  // instead of leaving the page blank.
  if (window.location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = `
        <div style="min-height:100vh; display:flex; align-items:center; justify-content:center; background:#FFFDF9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; padding:24px;">
          <div style="max-width:480px; background:#FFFFFF; border:1px solid #ECE4D3; border-radius:20px; padding:36px; text-align:center;">
            <div style="width:52px; height:52px; border-radius:14px; background:#FBEAE5; color:#A2412A; display:flex; align-items:center; justify-content:center; font-size:22px; margin:0 auto 18px;">!</div>
            <h1 style="font-family:Georgia,serif; font-size:20px; margin:0 0 10px;">This page needs a local server</h1>
            <p style="color:#6B5F4F; font-size:14px; line-height:1.6; margin:0 0 18px;">
              You opened this file directly (double-clicked it). Browsers block the app's
              data and navigation from loading that way. Run <strong>start-server.bat</strong>
              (Windows) in the project's root folder, or see <strong>README.md</strong>
              for other options — then open the page at the <code>http://localhost...</code>
              address it gives you instead.
            </p>
          </div>
        </div>
      `;
    });
    // Skip the rest of this file — nothing below can work under file://.
    window.__sabilearnFileProtocol = true;
  }

  const SITE_ROOT = window.SITE_ROOT || './';
  const APP_ROOT = window.APP_ROOT || './';

  function resolveTokens(html) {
    return html
      .replaceAll('{{APP_ROOT}}', APP_ROOT)
      .replaceAll('{{SITE_ROOT}}', SITE_ROOT);
  }

  function setActiveNav() {
    const currentPage = document.body.dataset.page;
    if (!currentPage) return;
    document.querySelectorAll('.sidebar-link[data-page]').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.page === currentPage);
    });
  }

  function wireMobileToggle() {
    const toggle = document.querySelector('.mobile-sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('is-open'));
    }
  }

  function wireUserDropdown() {
    const trigger = document.getElementById('user-menu-toggle');
    const dropdown = document.getElementById('user-menu-dropdown');
    if (!trigger || !dropdown) return;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('is-open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('is-open'));

    const notifToggle = document.getElementById('notif-toggle');
    notifToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.location.href = `${SITE_ROOT}app/notifications/notifications.html`;
    });

    document.getElementById('topbar-logout-link')?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (typeof sabilearnDialog !== 'function') { window.location.href = `${SITE_ROOT}auth/login.html`; return; }
      const ok = await sabilearnDialog({
        title: 'Log out of your account?',
        body: "You'll need to sign in again to access your learning space.",
        confirmLabel: 'Log Out',
        icon: '\u21B0',
      });
      if (ok) window.location.href = `${SITE_ROOT}auth/login.html`;
    });
  }

  async function includePartial(el) {
    const name = el.dataset.include;
    try {
      const res = await fetch(`${SITE_ROOT}components/${name}.html`);
      const html = await res.text();
      el.outerHTML = resolveTokens(html);
    } catch (err) {
      console.error(`Failed to load component: ${name}`, err);
    }
  }

  function wireOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'offline-banner';
      banner.className = 'offline-banner';
      banner.textContent = "You're offline — check your internet connection and try again.";
      document.body.prepend(banner);
    }
    const update = () => banner.classList.toggle('is-visible', !navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  async function wireNotifBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    try {
      const res = await fetch(`${SITE_ROOT}data/mock/notifications.json`);
      const data = await res.json();
      const unread = data.notifications.filter((n) => !n.read).length;
      if (unread > 0) { badge.textContent = unread; badge.style.display = 'flex'; }
    } catch (e) { /* notifications not available on this page context */ }
  }

  function wireGlobalSearch() {
    const input = document.querySelector('.topbar-search input');
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `${SITE_ROOT}app/search/search-results.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const includes = Array.from(document.querySelectorAll('[data-include]'));
    await Promise.all(includes.map(includePartial));
    setActiveNav();
    wireMobileToggle();
    wireUserDropdown();
    wireOfflineBanner();
    wireNotifBadge();
    wireGlobalSearch();
    document.dispatchEvent(new CustomEvent('sabilearn:shell-ready'));
  });
})();
