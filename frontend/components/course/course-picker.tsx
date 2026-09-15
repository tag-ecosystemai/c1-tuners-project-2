"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCourses } from "@/lib/api";
import { mockCourses } from "@/lib/mock-data";
import type { Course } from "@/types";

export function CoursePicker({
  targetTab,
  actionLabel,
}: {
  targetTab: "quiz" | "flashcards";
  actionLabel: string;
}) {
  const Icon = targetTab === "quiz" ? ClipboardCheck : Layers;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses()
      .then((data) => setCourses(data.length ? data : mockCourses))
      .catch(() => setCourses(mockCourses))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-muted">Loading courses…</p>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <Link key={course.id} href={`/courses/${course.id}?tab=${targetTab}`}>
          <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-light">
              <Icon className="h-4 w-4 text-forest" />
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
              {course.code}
            </p>
            <h3 className="font-serif text-lg text-ink">{course.name}</h3>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-forest">
              {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}