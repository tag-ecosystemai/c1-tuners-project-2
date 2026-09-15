import { CoursePicker } from "@/components/course/course-picker";

export default function FlashcardsPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-serif text-3xl text-ink">Flashcards</h1>
      <p className="mt-1 mb-8 text-ink-muted">Pick a course to review its flashcards.</p>
      <CoursePicker targetTab="flashcards" actionLabel="Review flashcards" />
    </div>
  );
}