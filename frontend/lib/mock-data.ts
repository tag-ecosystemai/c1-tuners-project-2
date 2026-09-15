import type { Course, Material, TutorAnswer, Quiz, Flashcard, StudyPlan } from "@/types";

export const mockCourses: Course[] = [
  { id: "csc301", code: "CSC 301", name: "Artificial Intelligence", progress: 68 },
  { id: "mth201", code: "MTH 201", name: "Differential Equations", progress: 54 },
  { id: "phy201", code: "PHY 201", name: "Mechanics", progress: 81 },
];

export const mockMaterials: Record<string, Material[]> = {
  csc301: [
    { id: "m1", name: "Lecture 04 — Neural Networks.pdf", type: "pdf", status: "ready" },
    { id: "m2", name: "Lecture 05 — Backpropagation.pdf", type: "pdf", status: "ready" },
    { id: "m3", name: "Tutorial Slides — CNNs.pptx", type: "pptx", status: "ready" },
  ],
  mth201: [
    { id: "m4", name: "Week 3 Notes — First Order ODEs.docx", type: "docx", status: "ready" },
    { id: "m5", name: "Practice Set 2.pdf", type: "pdf", status: "ready" },
  ],
  phy201: [
    { id: "m6", name: "Lecture 02 — Kinematics.pdf", type: "pdf", status: "ready" },
  ],
};

export const mockTutorAnswer: TutorAnswer = {
  explanation:
    "This is a placeholder answer — the real AI Tutor will read your uploaded material and answer based on it once the backend is connected.",
  analogy:
    "Think of this like a stand-in actor rehearsing blocking before the real performer arrives.",
  example:
    "Once connected, asking about a specific concept from your notes will return a grounded, material-specific answer here instead of this placeholder.",
  source: "Sample response — backend not connected yet",
};

export const mockQuiz: Quiz = {
  quizId: "mock-quiz-1",
  questions: [
    {
      id: "q1",
      prompt: "What is the primary purpose of backpropagation?",
      options: [
        { id: "a", text: "To increase the learning rate" },
        { id: "b", text: "To calculate how much each weight contributed to the error" },
        { id: "c", text: "To normalize input data" },
        { id: "d", text: "To add more layers to the network" },
      ],
      correctOptionId: "b",
      explanation:
        "Backpropagation works backward from the output, using the chain rule to compute each weight's contribution to the error.",
    },
    {
      id: "q2",
      prompt: "Which activation function outputs values between 0 and 1?",
      options: [
        { id: "a", text: "ReLU" },
        { id: "b", text: "Sigmoid" },
        { id: "c", text: "Linear" },
        { id: "d", text: "Softmax only" },
      ],
      correctOptionId: "b",
      explanation: "Sigmoid squashes any input into the range 0 to 1.",
    },
    {
      id: "q3",
      prompt: "What does dropout help prevent during training?",
      options: [
        { id: "a", text: "Underfitting" },
        { id: "b", text: "Slow training speed" },
        { id: "c", text: "Overfitting" },
        { id: "d", text: "Vanishing gradients" },
      ],
      correctOptionId: "c",
      explanation:
        "Dropout randomly disables neurons during training, discouraging the network from over-relying on any single pathway.",
    },
  ],
};

export const mockFlashcards: Flashcard[] = [
  { id: "f1", front: "What is supervised learning?", back: "A machine learning approach where a model learns from labeled examples." },
  { id: "f2", front: "What is backpropagation?", back: "The algorithm that computes how much each weight contributed to the output error, working backward from the output layer." },
  { id: "f3", front: "What does an activation function do?", back: "It introduces non-linearity, letting the network learn complex patterns rather than just linear combinations." },
  { id: "f4", front: "What is overfitting?", back: "When a model learns the training data too specifically and performs poorly on new, unseen data." },
  { id: "f5", front: "What is dropout?", back: "A technique that randomly disables neurons during training to prevent overfitting." },
];



export const mockStudyPlan: StudyPlan = {
  id: "plan-1",
  days: [
    {
      day: 1,
      topic: "Neural Networks fundamentals",
      tasks: [
        { id: "t1", label: "Review Lecture 04 summary", done: false },
        { id: "t2", label: "Go through flashcards", done: false },
        { id: "t3", label: "Take a 10-question quiz", done: false },
      ],
    },
    {
      day: 2,
      topic: "Backpropagation deep dive",
      tasks: [
        { id: "t4", label: "Re-watch the backpropagation segment", done: false },
        { id: "t5", label: "Ask the AI Tutor about the chain rule steps", done: false },
        { id: "t6", label: "Practice problems on gradient descent", done: false },
      ],
    },
    {
      day: 3,
      topic: "CNNs and review",
      tasks: [
        { id: "t7", label: "Read the CNN tutorial slides", done: false },
        { id: "t8", label: "Retake the quiz, focus on weak areas", done: false },
        { id: "t9", label: "Light review — no new material", done: false },
      ],
    },
  ],
};