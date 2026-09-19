// SABILEARN — Generated content store
//
// The backend can generate real quiz and flashcard content on demand
// (POST /quiz/, POST /flashcards/ — backend/app/routes/quiz.py and
// flashcards.py) but it has no database tables to save that content for
// later, and no endpoint for quiz-attempt history at all. Until the
// backend adds that persistence, this module is the frontend's stand-in
// for it: it normalizes whatever the backend actually returned and caches
// it in localStorage (per-browser, not per-account) so decks/quizzes can
// be reopened and a real history can build up.
//
// IMPORTANT: nothing in this file invents quiz questions, flashcards, or
// scores. It only reshapes and stores what the backend generated, or what
// the learner actually did (their real answers/scores) while using it.
// When the backend gains real persistence for these, the pages using this
// module should be pointed at that instead — see the TODOs in quiz-setup.js
// and flashcards-hub.js/course.js.

const SABILEARN_STORE_PREFIX = 'sabilearn:generated:';

function sabilearnReadStore(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch (err) {
    console.warn('Sabilearn: could not read local store', key, err);
    return [];
  }
}

function sabilearnWriteStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Sabilearn: could not write local store', key, err);
  }
}

function sabilearnAllForPrefix(prefix) {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) out.push(...sabilearnReadStore(k));
  }
  return out;
}

// ---------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------

// Reshapes a list of raw backend quiz questions into { q, options, correct,
// why }. Split out so the Study Agent can render a quiz it gets back from
// POST /study-agent/ using exactly the same rules as /quiz/.
function sabilearnNormalizeQuizQuestions(rawQuestions) {
  return (Array.isArray(rawQuestions) ? rawQuestions : []).map((q) => {
    const options = q.options || q.choices || q.answers || [];
    let correct = q.correct;
    if (correct === undefined || correct === null) correct = q.correct_index;
    if (correct === undefined || correct === null) correct = q.correctIndex;
    if (correct === undefined || correct === null) correct = q.answer_index;
    if (correct === undefined || correct === null) {
      const answerText = q.correct_answer ?? (typeof q.answer === 'string' ? q.answer : undefined);
      if (answerText !== undefined) {
        correct = options.findIndex((o) => String(o).trim().toLowerCase() === String(answerText).trim().toLowerCase());
      }
    }
    if (typeof q.answer === 'number') correct = q.answer;
    if (!Number.isInteger(correct) || correct < 0) correct = 0;
    return {
      q: q.q || q.question || q.text || q.prompt || 'Question',
      options,
      correct,
      why: q.why || q.explanation || q.rationale || '',
    };
  }).filter((q) => Array.isArray(q.options) && q.options.length > 0);
}

// Same idea for flashcards: [{ q, a }].
function sabilearnNormalizeCards(rawCards) {
  return (Array.isArray(rawCards) ? rawCards : []).map((c) => ({
    q: c.q || c.question || c.front || c.term || '',
    a: c.a || c.answer || c.back || c.definition || '',
  })).filter((c) => c.q && c.a);
}

// Normalizes the POST /quiz/ response body into the same shape the app's
// quiz engine already expects (see data/mock/quizzes.json). The backend's
// question-generation module (ai/features/quiz.py) isn't part of this
// bundle, so this reads several plausible field names defensively rather
// than assuming one exact shape.
function normalizeBackendQuiz(raw, meta) {
  const rawQuestions = Array.isArray(raw?.quiz) ? raw.quiz
    : Array.isArray(raw?.quiz?.questions) ? raw.quiz.questions
    : Array.isArray(raw?.questions) ? raw.questions
    : [];

  const questions = sabilearnNormalizeQuizQuestions(rawQuestions);

  const topic = meta.topic || raw?.topic || null;
  const id = `backend-quiz-${meta.courseId}-${Date.now()}`;
  return {
    id,
    courseId: String(meta.courseId),
    courseCode: meta.courseCode || 'COURSE',
    title: topic ? `${topic} Quiz` : `${meta.courseTitle || 'Course'} Quiz`,
    topic: topic || meta.courseTitle || 'this course',
    difficulty: meta.difficulty || 'Medium',
    questions,
    source: 'backend',
    createdAt: new Date().toISOString(),
  };
}

function saveGeneratedQuiz(quiz) {
  const key = `${SABILEARN_STORE_PREFIX}quizzes:${quiz.courseId}`;
  const list = sabilearnReadStore(key);
  list.unshift(quiz);
  sabilearnWriteStore(key, list.slice(0, 20));
  return quiz;
}

function getGeneratedQuizzes(courseId) {
  return sabilearnReadStore(`${SABILEARN_STORE_PREFIX}quizzes:${courseId}`);
}

function getAllGeneratedQuizzes() {
  return sabilearnAllForPrefix(`${SABILEARN_STORE_PREFIX}quizzes:`);
}

function getGeneratedQuizById(id) {
  return getAllGeneratedQuizzes().find((q) => q.id === id) || null;
}

// Records a real completed attempt (the learner's actual score) against a
// backend-generated quiz, so the Quizzes hub / course quizzes tab can show
// real history instead of nothing, until the backend has its own
// quiz-attempt endpoint.
function saveQuizAttempt(attempt) {
  const key = `${SABILEARN_STORE_PREFIX}quiz-history`;
  const list = sabilearnReadStore(key);
  list.unshift({ ...attempt, at: attempt.at || new Date().toISOString(), date: attempt.date || new Date().toLocaleDateString() });
  sabilearnWriteStore(key, list.slice(0, 200));
}

function getQuizHistory(courseId) {
  const all = sabilearnReadStore(`${SABILEARN_STORE_PREFIX}quiz-history`);
  return courseId ? all.filter((h) => String(h.courseId) === String(courseId)) : all;
}

// ---------------------------------------------------------------------
// Flashcards
// ---------------------------------------------------------------------

// Normalizes the POST /flashcards/ response body into the same shape the
// app's flashcard engine already expects (see data/mock/flashcards.json).
function normalizeBackendFlashcards(raw, meta) {
  const rawCards = Array.isArray(raw?.flashcards) ? raw.flashcards
    : Array.isArray(raw?.flashcards?.cards) ? raw.flashcards.cards
    : Array.isArray(raw?.cards) ? raw.cards
    : [];

  const cards = sabilearnNormalizeCards(rawCards);

  const topic = meta.topic || raw?.topic || null;
  const id = `backend-deck-${meta.courseId}-${Date.now()}`;
  return {
    id,
    courseId: String(meta.courseId),
    courseCode: meta.courseCode || 'COURSE',
    title: topic ? `${topic} Flashcards` : `${meta.courseTitle || 'Course'} Flashcards`,
    topic,
    totalCards: cards.length,
    dueCount: cards.length,
    progress: 0,
    lastReviewed: 'Never',
    cards,
    source: 'backend',
    createdAt: new Date().toISOString(),
  };
}

function saveGeneratedDeck(deck) {
  const key = `${SABILEARN_STORE_PREFIX}decks:${deck.courseId}`;
  const list = sabilearnReadStore(key);
  list.unshift(deck);
  sabilearnWriteStore(key, list.slice(0, 20));
  return deck;
}

function updateGeneratedDeck(deck) {
  const key = `${SABILEARN_STORE_PREFIX}decks:${deck.courseId}`;
  const list = sabilearnReadStore(key);
  const idx = list.findIndex((d) => d.id === deck.id);
  if (idx >= 0) list[idx] = deck; else list.unshift(deck);
  sabilearnWriteStore(key, list);
}

function getGeneratedDecks(courseId) {
  return sabilearnReadStore(`${SABILEARN_STORE_PREFIX}decks:${courseId}`);
}

function getAllGeneratedDecks() {
  return sabilearnAllForPrefix(`${SABILEARN_STORE_PREFIX}decks:`);
}

function getGeneratedDeckById(id) {
  return getAllGeneratedDecks().find((d) => d.id === id) || null;
}
