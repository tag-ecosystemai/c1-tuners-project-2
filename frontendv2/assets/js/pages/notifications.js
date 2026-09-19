// SABILEARN — Notifications behavior

const TYPE_ICONS = { learning: '\u2726', system: '\u2699' };

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const data = await loadJSON('../../data/mock/notifications.json');
  let notifications = data.notifications;
  let activeFilter = 'all';

  function render() {
    const filtered = activeFilter === 'all' ? notifications : notifications.filter((n) => n.type === activeFilter);
    const wrap = document.getElementById('notif-list');
    document.getElementById('mark-all-read-btn').style.display = notifications.some((n) => !n.read) ? 'inline-flex' : 'none';

    if (filtered.length === 0) {
      wrap.innerHTML = `
        <div class="page-empty-state">
          <div class="icon">🔔</div>
          <h3>You're all caught up</h3>
          <p>No notifications here right now.</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = filtered.map((n) => `
      <div class="card notif-card ${n.read ? '' : 'is-unread'}" data-id="${n.id}">
        ${n.read ? '' : '<span class="notif-unread-dot"></span>'}
        <span class="notif-icon">${TYPE_ICONS[n.type]}</span>
        <div class="notif-card-body">
          <div class="notif-card-title">${n.title}</div>
          <div class="notif-card-text">${n.body}</div>
          <div class="notif-card-time">${n.time}</div>
        </div>
      </div>
    `).join('');

    wrap.querySelectorAll('.notif-card').forEach((card) => {
      card.addEventListener('click', () => {
        const n = notifications.find((x) => x.id === card.dataset.id);
        n.read = true;
        window.location.href = `../${n.link}`;
      });
    });
  }

  document.querySelectorAll('.notif-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.notif-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      activeFilter = tab.dataset.filter;
      render();
    });
  });

  document.getElementById('mark-all-read-btn').addEventListener('click', () => {
    notifications.forEach((n) => n.read = true);
    render();
  });

  render();
});
