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
// Confirmed shape: GET /courses/ -> { courses: [{ id, name, code, description, created_at }] }
// No "progress" field exists on the backend yet — defaults to 0.
type RawCourse = { id: number; name: string; code: string; description?: string };

function mapCourse(c: RawCourse): Course {
  return { id: String(c.id), code: c.code, name: c.name, progress: 0 };
}

export const getCourses = async (): Promise<Course[]> => {
  const data = await request<{ courses: RawCourse[] }>("/courses/");
  return data.courses.map(mapCourse);
};

// Confirmed shape: POST /courses/ body { name, code, description } ->
// { message, course: {...} }
export const createCourse = async (code: string, name: string): Promise<Course> => {
  const data = await request<{ course: RawCourse }>("/courses/", {
    method: "POST",
    body: JSON.stringify({ name, code, description: "" }),
  });
  return mapCourse(data.course);
};

export const deleteCourse = (courseId: string) =>
  request<void>(`/courses/${courseId}`, { method: "DELETE" });

// No GET /courses/{id} on this backend yet — fetch the list and find it
// client-side. Throws if not found, so existing mock-fallback catches
// still work unchanged.
export const getCourse = async (courseId: string): Promise<Course> => {
  const courses = await getCourses();
  const found = courses.find((c) => c.id === courseId);
  if (!found) throw new Error(`Course ${courseId} not found`);
  return found;
};

// --- Materials ---
// Confirmed shape: GET /materials/course/{course_id} ->
// { course_id, course_name, course_code, materials: [{ id, filename, file_type, file_path, uploaded_at }] }
// No "status" field — the backend has no staged processing yet, so
// everything that comes back is treated as "ready".
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

// Confirmed shape: POST /materials/upload — multipart fields "course_id"
// (int) and "file". Response: { message, material: {...} }
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
// Confirmed shape: POST /ask/ body { question, course_id } ->
// { question, course_id, answer } where "answer" is one long text block,
// not separate explanation/analogy/example fields. We put the whole thing
// in "explanation" and pull out a "Source: ..." line if the model included
// one, since that pattern showed up consistently in testing.
export const askTutor = async (
  courseId: string,
  question: string
): Promise<TutorAnswer> => {
  const data = await request<{ answer: string }>("/ask/", {
    method: "POST",
    body: JSON.stringify({ question, course_id: Number(courseId) }),
  });

  const sourceMatch = data.answer.match(/Source:\s*(.+)$/im);
  const source = sourceMatch ? sourceMatch[1].trim() : "";
  const explanation = source
    ? data.answer.replace(sourceMatch![0], "").trim()
    : data.answer;

  return { explanation, analogy: "", example: "", source };
};

// --- Quiz, Flashcards, Study Agent/Plan, Profile ---
// Not built on the backend yet — left pointed at the original contract
// paths. These 404, get caught, and fall back to mock data automatically,
// same as every screen already does. Update the path here once each one
// is confirmed real — no other files need to change.

export const generateQuiz = (courseId: string, materialId?: string) =>
  request<Quiz>(
    `/courses/${courseId}/quiz/generate${materialId ? `?material_id=${materialId}` : ""}`,
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

export const getFlashcards = (courseId: string, materialId?: string) =>
  request<Flashcard[]>(
    `/courses/${courseId}/flashcards${materialId ? `?material_id=${materialId}` : ""}`
  );

export const createStudyPlan = (prompt: string, courseContext: string) =>
  request<StudyPlan>("/study-agent/plan", {
    method: "POST",
    body: JSON.stringify({ prompt, course_context: courseContext }),
  });

export const getStudyPlan = () => request<StudyPlan>("/study-plan");

export const getProfile = () => request<Profile>("/profile");
export const updateProfile = (data: Partial<Profile>) =>
  request<Profile>(`/profile?${new URLSearchParams(data as Record<string, string>)}`, {
    method: "PUT",
  });