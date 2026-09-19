// SABILEARN — Home dashboard behavior

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

const FOCUS_ICONS = { review: '\u{1F4A1}', quiz: '\u2756', flashcards: '\u23F1' };

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

function renderContinueLearning(data) {
  document.getElementById('continue-course-tag').textContent = data.courseCode + ' · ' + data.courseTitle;
  document.getElementById('continue-lecture-title').textContent = data.lectureTitle;
  document.getElementById('continue-progress-fill').style.width = data.progress + '%';
  document.getElementById('continue-progress-label').textContent = data.progress + '% complete';
  document.getElementById('continue-btn').href = `study/study-session.html?course=${data.courseId}&topic=${encodeURIComponent(data.topic || '')}`;
}

function renderComingUp(data) {
  document.getElementById('coming-up-title').textContent = data.title;
  document.getElementById('coming-up-sub').textContent = data.subtitle;
  document.getElementById('coming-up-days-num').textContent = data.daysRemaining;
  document.getElementById('coming-up-date').textContent = data.date;
}

function renderFocus(list) {
  const wrap = document.getElementById('focus-grid');
  wrap.innerHTML = list.map((item) => `
    <div class="card focus-card">
      <div class="focus-icon">${FOCUS_ICONS[item.type] || '\u2726'}</div>
      <div class="focus-card-body">
        <div class="focus-card-title">${item.title}</div>
        <div class="focus-card-meta">${item.duration} · ${item.course}</div>
      </div>
      <span class="focus-arrow">→</span>
    </div>
  `).join('');
}

function renderCourseHealth(courses) {
  const wrap = document.getElementById('course-health-list');
  wrap.innerHTML = courses.map((c) => `
    <div class="progress-row">
      <svg class="progress-ring-mini" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-border)" stroke-width="4"/>
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-primary)" stroke-width="4"
          stroke-dasharray="${2 * Math.PI * 16}" stroke-dashoffset="${2 * Math.PI * 16 * (1 - c.progress / 100)}"
          stroke-linecap="round" transform="rotate(-90 20 20)"/>
      </svg>
      <div class="progress-row-body">
        <div class="progress-row-top"><span>${c.code} · ${c.title}</span><span>${c.progress}%</span></div>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${c.progress}%"></div></div>
      </div>
    </div>
  `).join('');
}

function renderWeakAreas(list) {
  const wrap = document.getElementById('weak-areas-list');
  wrap.innerHTML = list.map((w) => `
    <div class="weak-row">
      <div>
        <div class="weak-row-topic">${w.topic}</div>
        <div class="weak-row-course">${w.course}</div>
      </div>
      <span class="badge tag-${w.confidence}">${w.confidence}</span>
    </div>
  `).join('');
}

function renderActivity(list) {
  const wrap = document.getElementById('activity-list');
  wrap.innerHTML = list.map((a) => `
    <div class="activity-row">
      <div>
        <div>${a.text}</div>
        <div class="activity-row-detail">${a.detail}</div>
      </div>
      <span class="activity-row-time">${a.time}</span>
    </div>
  `).join('');
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const [home, courseData] = await Promise.all([
    loadJSON('../data/mock/home.json'),
    loadJSON('../data/mock/courses.json'),
  ]);

  document.getElementById('home-date').textContent = formatToday();
  document.getElementById('home-greeting').textContent = `${timeGreeting()}, ${home.greetingName}.`;

  renderContinueLearning(home.continueLearning);
  renderComingUp(home.comingUp);
  renderFocus(home.todaysFocus);
  renderCourseHealth(courseData.courses);
  renderWeakAreas(home.weakAreas);
  renderActivity(home.recentActivity);

  // ---- Quick Action (Screen 44) ----
  const fab = document.getElementById('quick-action-fab');
  const menu = document.getElementById('quick-action-menu');
  fab.addEventListener('click', (e) => {
    e.stopPropagation();
    fab.classList.toggle('is-open');
    menu.classList.toggle('is-open');
  });
  document.addEventListener('click', () => { fab.classList.remove('is-open'); menu.classList.remove('is-open'); });
});
