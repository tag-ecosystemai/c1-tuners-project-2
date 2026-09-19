// SABILEARN — Study screen behavior (now a direct AI agent chatbox)
// Demo courses/materials (mock) and real backend courses are both loaded:
// the demo data keeps powering the demo "detected course" chips, and the
// backend courses power the suggestion chips and the ?course=<id> deep link.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const topic = params.get('topic');
  const courseId = params.get('course');

  const [{ courses }, materialsData, backendCourses] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    loadJSON('../../data/mock/materials.json'),
    sabilearnGetBackendCourses(),
  ]);

  const agent = initStudyAgent(document.getElementById('study-agent-root'), { courses, materialsData, backendCourses });

  // Arriving from "Continue Learning", "Study Topic", a Study Plan task, etc.
  // -- skip the blank-chat moment and ask about that topic right away.
  if (topic) {
    agent.ask(`Explain ${decodeURIComponent(topic)}`);
  } else if (courseId) {
    const mockCourse = courses.find((c) => c.id === courseId);
    const backendCourse = backendCourses.find((c) => String(c.id) === String(courseId));
    const title = mockCourse ? mockCourse.title : backendCourse ? backendCourse.name : null;
    if (title) agent.ask(`What should I focus on in ${title}?`);
  }
});
