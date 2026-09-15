export interface Profile {
  id: string;
  name: string;
  university: string | null;
  program: string | null;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  progress: number;
}

export type MaterialStatus =
  | "uploading"
  | "extracting"
  | "understanding"
  | "ready"
  | "failed";

export interface Material {
  id: string;
  name: string;
  type: string;
  status: MaterialStatus;
}

export interface TutorAnswer {
  explanation: string;
  analogy: string;
  example: string;
  source: string;
}

export interface ChatMessage {
  id: string;
  role: "student" | "ai";
  question?: string;
  answer?: TutorAnswer;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
}

export interface Quiz {
  quizId: string;
  questions: QuizQuestion[];
}

export interface QuizAttemptResult {
  score: number;
  total: number;
  strongAreas: string[];
  needsReview: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface StudyTask {
  id: string;
  label: string;
  done: boolean;
}

export interface StudyDay {
  day: number;
  topic: string;
  tasks: StudyTask[];
}

export interface StudyPlan {
  id: string;
  days: StudyDay[];
}

export interface OnboardingData {
  name: string;
  university: string;
  program: string;
  courses: { code: string; name: string }[];
  helpWith: string[];
  learningStyle: string[];
}
