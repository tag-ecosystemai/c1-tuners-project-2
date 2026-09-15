import { CoursePicker } from "@/components/course/course-picker";

export default function QuizzesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl text-ink">Quizzes</h1>
      <p className="mt-1 mb-8 text-ink-muted">Pick a course to generate a quiz from its materials.</p>
      <CoursePicker targetTab="quiz" actionLabel="Take a quiz" />
    </div>
  );
}