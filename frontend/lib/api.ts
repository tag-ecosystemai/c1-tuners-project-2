import type {
  Profile,
  Course,
  Material,
  TutorAnswer,
  Quiz,
  QuizAttemptResult,
  Flashcard,
  StudyPlan,
} from "@/types";
import { categorizeFile } from "@/lib/file-type";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status} on ${path}: ${body}`);
  }
  return res.json();
}

// --- Courses ---
type RawCourse = { id: number; name: string; code: string; description?: string };

function mapCourse(c: RawCourse): Course {
  return { id: String(c.id), code: c.code, name: c.name, progress: 0 };
}

export const getCourses = async (): Promise<Course[]> => {
  const data = await request<{ courses: RawCourse[] }>("/courses/");
  return data.courses.map(mapCourse);
};

export const createCourse = async (code: string, name: string): Promise<Course> => {
  const data = await request<{ course: RawCourse }>("/courses/", {
    method: "POST",
    body: JSON.stringify({ name, code, description: "" }),
  });
  return mapCourse(data.course);
};

export const deleteCourse = (courseId: string) =>
  request<void>(`/courses/${courseId}`, { method: "DELETE" });

export const getCourse = async (courseId: string): Promise<Course> => {
  const courses = await getCourses();
  const found = courses.find((c) => c.id === courseId);
  if (!found) throw new Error(`Course ${courseId} not found`);
  return found;
};

// --- Materials ---
type RawMaterial = { id: number; filename: string };

function mapMaterial(m: RawMaterial): Material {
  return {
    id: String(m.id),
    name: m.filename,
    type: categorizeFile(m.filename),
    status: "ready",
  };
}

export const getMaterials = async (courseId: string): Promise<Material[]> => {
  const data = await request<{ materials: RawMaterial[] }>(`/materials/course/${courseId}`);
  return data.materials.map(mapMaterial);
};

export const uploadMaterial = async (
  courseId: string,
  file: File
): Promise<Material> => {
  const formData = new FormData();
  formData.append("course_id", courseId);
  formData.append("file", file);

  const res = await fetch(`${API_URL}/materials/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  const data = await res.json();
  return mapMaterial(data.material);
};

export const getMaterialStatus = (courseId: string, materialId: string) =>
  request<{ status: string }>(`/materials/${materialId}/status`);

// --- AI Tutor ---
export const askTutor = async (
  courseId: string,
  question: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<TutorAnswer> => {
  const data = await request<{ answer: string }>("/ask/", {
    method: "POST",
    body: JSON.stringify({ question, course_id: Number(courseId), chat_history: chatHistory, }),
  });

  const sourceMatch = data.answer.match(/Source:\s*(.+)$/im);
  const source = sourceMatch ? sourceMatch[1].trim() : "";
  const explanation = source
    ? data.answer.replace(sourceMatch![0], "").trim()
    : data.answer;

  return { explanation, analogy: "", example: "", source };
};

// --- Quiz ---
// Confirmed shape: POST /quiz/ body { course_id, topic, num_questions } ->
// { course_id, topic, quiz: { questions: [{ question, options, answer, explanation }] } }
// Options come back as plain strings (no ids) and "answer" is the correct
// option's TEXT, not an id — we generate letter ids ourselves and match
// the answer text to find correctOptionId.
export const generateQuiz = async (courseId: string, topic = "General concepts"): Promise<Quiz> => {
  const data = await request<{
    quiz: { questions: { question: string; options: string[]; answer: string; explanation: string }[] };
  }>("/quiz/", {
    method: "POST",
    body: JSON.stringify({ course_id: Number(courseId), topic, num_questions: 5 }),
  });

  const letters = ["a", "b", "c", "d", "e", "f"];
  const questions = data.quiz.questions.map((q, i) => {
    const options = q.options.map((text, idx) => ({ id: letters[idx] ?? String(idx), text }));
    const correct = options.find((o) => o.text === q.answer);
    return {
      id: `q${i + 1}`,
      prompt: q.question,
      options,
      correctOptionId: correct?.id ?? options[0]?.id ?? "a",
      explanation: q.explanation,
    };
  });

  return { quizId: crypto.randomUUID(), questions };
};

export const submitQuizAttempt = (
  quizId: string,
  answers: { questionId: string; selectedOptionId: string }[]
) =>
  request<QuizAttemptResult>(`/quiz/${quizId}/attempts`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

// --- Flashcards ---
// Confirmed shape: POST /flashcards/ body { course_id, topic, num_cards } ->
// { course_id, topic, flashcards: { flashcards: [{ question, answer }] } }
export const getFlashcards = async (courseId: string, topic = "General concepts"): Promise<Flashcard[]> => {
  const data = await request<{ flashcards: { flashcards: { question: string; answer: string }[] } }>(
    "/flashcards/",
    {
      method: "POST",
      body: JSON.stringify({ course_id: Number(courseId), topic, num_cards: 8 }),
    }
  );
  return data.flashcards.flashcards.map((c, i) => ({
    id: `f${i + 1}`,
    front: c.question,
    back: c.answer,
  }));
};

// --- Study Agent / Study Plan ---
// createStudyPlan/getStudyPlan still point at unconfirmed contract paths —
// no real endpoint returns a structured day-by-day StudyPlan yet, so these
// keep falling back to mock data. askStudyAgentChat below IS real and
// confirmed, but it's a different thing: a general Q&A chat, not a plan generator.
export const createStudyPlan = (prompt: string, courseContext: string) =>
  request<StudyPlan>("/study-agent/plan", {
    method: "POST",
    body: JSON.stringify({ prompt, course_context: courseContext }),
  });

export const askStudyAgentChat = async (
  question: string,
  history: { role: string; content: string }[] = []
): Promise<{ text: string; source: string }> => {
  const data = await request<{ answer: string }>("/study-agent/", {
    method: "POST",
    body: JSON.stringify({ question, history }),
  });

  const sourceMatch = data.answer.match(/Source:\s*(.+)$/im);
  const source = sourceMatch ? sourceMatch[1].trim() : "";
  const text = sourceMatch
    ? data.answer.replace(sourceMatch[0], "").trim()
    : data.answer;

  return { text, source };
};

export const getStudyPlan = () => request<StudyPlan>("/study-plan");

export const getProfile = () => request<Profile>("/profile");
export const updateProfile = (data: Partial<Profile>) =>
  request<Profile>(`/profile?${new URLSearchParams(data as Record<string, string>)}`, {
    method: "PUT",
  });