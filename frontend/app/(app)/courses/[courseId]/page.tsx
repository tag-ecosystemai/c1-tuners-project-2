"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { MaterialCard } from "@/components/materials/material-card";
import { UploadModal } from "@/components/materials/upload-modal";
import { TutorPanel } from "@/components/tutor/tutor-panel";
import { QuizPanel } from "@/components/quiz/quiz-panel";
import { FlashcardPanel } from "@/components/flashcards/flashcard-panel";
import { getCourse, getMaterials } from "@/lib/api";
import { mockCourses, mockMaterials } from "@/lib/mock-data";
import type { Course, Material } from "@/types";

const TABS = [
  { key: "materials", label: "Materials" },
  { key: "tutor", label: "AI Tutor" },
  { key: "quiz", label: "Quizzes" },
  { key: "flashcards", label: "Flashcards" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const searchParams = useSearchParams();
  const courseId = params.courseId;

  const requestedTab = searchParams.get("tab") as TabKey | null;
  const initialTab: TabKey =
    requestedTab && TABS.some((t) => t.key === requestedTab) ? requestedTab : "materials";

  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    getCourse(courseId)
      .then(setCourse)
      .catch(() => setCourse(mockCourses.find((c) => c.id === courseId) ?? null));

    getMaterials(courseId)
      .then((data) => setMaterials(data.length ? data : mockMaterials[courseId] ?? []))
      .catch(() => setMaterials(mockMaterials[courseId] ?? []));
  }, [courseId]);

  if (!course) {
    return <p className="text-sm text-ink-muted">Loading course…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {course.code}
      </p>
      <h1 className="mt-1 font-serif text-3xl text-ink">{course.name}</h1>

      <div className="mt-4 max-w-xs">
        <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
          <span>Progress</span>
          <span>{course.progress}%</span>
        </div>
        <ProgressBar value={course.progress} />
      </div>

      <div className="mt-8 flex gap-1 border-b border-border">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "border-b-2 border-forest px-4 py-2.5 text-sm font-medium text-forest"
                : "border-b-2 border-transparent px-4 py-2.5 text-sm text-ink-muted hover:text-ink"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "materials" && (
          <div>
            <div className="mb-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4" /> Upload material
              </Button>
            </div>

            {materials.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-ink">No materials yet.</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Upload your first note or slide deck for this course.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {materials.map((m) => (
                  <MaterialCard key={m.id} material={m} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "tutor" && <TutorPanel courseId={courseId} />}
        {tab === "quiz" && <QuizPanel courseId={courseId} />}
        {tab === "flashcards" && <FlashcardPanel courseId={courseId} />}
      </div>

      {showUpload && (
        <UploadModal
          courseId={courseId}
          onClose={() => setShowUpload(false)}
          onUploaded={(material) => {
            setMaterials((prev) => [...prev, material]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}