// SABILEARN — Topic Progress Details behavior
// NOTE: quiz/practice/flashcard sub-scores are derived from the topic's overall
// mastery for this mock (small deterministic spread). TODO: replace with real
// per-metric data from GET /progress/topics/:topic once the backend exists.

async function loadJSON(path) {
  const res = await fetch(path);
  return res.json();
}

document.addEventListener('sabilearn:shell-ready', async () => {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('course') || 'csc301';
  const topicName = params.get('topic') || 'Neural Networks';

  const { courses } = await loadJSON('../../data/mock/courses.json');
  const course = courses.find((c) => c.id === courseId) || courses[0];
  const topic = course.topics.find((t) => t.name === topicName) || course.topics[0];

  const quizAcc = Math.min(100, topic.mastery + 6);
  const practiceAcc = Math.max(0, topic.mastery - 3);
  const flashcardRecall = Math.min(100, topic.mastery + 3);
  const weak = topic.mastery < 60;

  document.getElementById('topic-badge').textContent = course.code;
  document.getElementById('topic-title').textContent = topic.name;
  document.getElementById('topic-mastery-value').textContent = `${topic.mastery}%`;
  document.getElementById('topic-mastery-ring-fill').style.strokeDashoffset = `${2 * Math.PI * 26 * (1 - topic.mastery / 100)}`;

  document.getElementById('metric-quiz').textContent = `${quizAcc}%`;
  document.getElementById('metric-practice').textContent = `${practiceAcc}%`;
  document.getElementById('metric-flashcard').textContent = `${flashcardRecall}%`;
  document.getElementById('metric-activity').textContent = topic.mastery > 70 ? 'High' : topic.mastery > 45 ? 'Moderate' : 'Low';

  document.getElementById('strengths-list').innerHTML = weak
    ? `<li>Basic terminology and definitions</li>`
    : `<li>Core concepts</li><li>Applying the idea to new examples</li>`;
  document.getElementById('needs-attention-list').innerHTML = weak
    ? `<li>${topic.name} — core mechanics</li><li>Applying it in multi-step problems</li>`
    : `<li>Nothing major — keep practicing to maintain this</li>`;

  document.getElementById('topic-ai-insight').textContent = weak
    ? `You understand the basic concepts well, but your recent answers show some difficulty with how ${topic.name.toLowerCase()} works in practice.`
    : `Strong, consistent understanding of ${topic.name}. Keep reinforcing it with periodic review.`;

  document.getElementById('action-study').href = `../study/study-session.html?course=${course.id}&topic=${encodeURIComponent(topic.name)}`;
  document.getElementById('action-practice').href = `../quizzes/quiz-setup.html?course=${course.id}`;
  document.getElementById('action-flashcards').href = `../flashcards/flashcards.html`;
  document.getElementById('action-quiz').href = `../quizzes/quiz-setup.html?course=${course.id}`;
});
