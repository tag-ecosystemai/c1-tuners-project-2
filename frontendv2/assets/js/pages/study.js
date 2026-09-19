// SABILEARN — Study screen behavior (now a direct AI agent chatbox)

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const topic = params.get('topic');
  const courseId = params.get('course');

  const [{ courses }, materialsData] = await Promise.all([
    loadJSON('../../data/mock/courses.json'),
    loadJSON('../../data/mock/materials.json'),
  ]);

  const agent = initStudyAgent(document.getElementById('study-agent-root'), { courses, materialsData });

  // Arriving from "Continue Learning", "Study Topic", a Study Plan task, etc.
  // -- skip the blank-chat moment and ask about that topic right away.
  if (topic) {
    agent.ask(`Explain ${decodeURIComponent(topic)}`);
  } else if (courseId) {
    const course = courses.find((c) => c.id === courseId);
    if (course) agent.ask(`What should I focus on in ${course.title}?`);
  }
});
