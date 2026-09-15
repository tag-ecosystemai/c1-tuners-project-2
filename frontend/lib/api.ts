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

// --- Profile ---
export const getProfile = () => request<Profile>("/profile");
export const updateProfile = (data: Partial<Profile>) =>
  request<Profile>(
    `/profile?${new URLSearchParams(data as Record<string, string>)}`,
    { method: "PUT" }
  );

// --- Courses ---
export const getCourses = () => request<Course[]>("/courses");
export const createCourse = (code: string, name: string) =>
  request<Course>("/courses", {
    method: "POST",
    body: JSON.stringify({ code, name }),
  });
export const getCourse = (courseId: string) =>
  request<Course>(`/courses/${courseId}`);

// --- Materials ---
export const getMaterials = (courseId: string) =>
  request<Material[]>(`/courses/${courseId}/materials`);

export const uploadMaterial = async (
  courseId: string,
  file: File
): Promise<Material> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/courses/${courseId}/materials`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
};

export const getMaterialStatus = (courseId: string, materialId: string) =>
  request<{ status: string }>(
    `/courses/${courseId}/materials/${materialId}/status`
  );

// --- AI Tutor ---
export const askTutor = (
  courseId: string,
  question: string,
  materialId?: string
) =>
  request<TutorAnswer>(`/courses/${courseId}/tutor/ask`, {
    method: "POST",
    body: JSON.stringify({ question, material_id: materialId }),
  });

// --- Quiz ---
export const generateQuiz = (courseId: string, materialId?: string) =>
  request<Quiz>(
    `/courses/${courseId}/quiz/generate${
      materialId ? `?material_id=${materialId}` : ""
    }`,
    { method: "POST" }
  );

export const submitQuizAttempt = (
  quizId: string,
  answers: { questionId: string; selectedOptionId: string }[]
) =>
  request<QuizAttemptResult>(`/quiz/${quizId}/attempts`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

// --- Flashcards ---
export const getFlashcards = (courseId: string, materialId?: string) =>
  request<Flashcard[]>(
    `/courses/${courseId}/flashcards${
      materialId ? `?material_id=${materialId}` : ""
    }`
  );

// --- Study Agent / Plan ---
export const createStudyPlan = (prompt: string, courseContext: string) =>
  request<StudyPlan>("/study-agent/plan", {
    method: "POST",
    body: JSON.stringify({ prompt, course_context: courseContext }),
  });

export const getStudyPlan = () => request<StudyPlan>("/study-plan");
