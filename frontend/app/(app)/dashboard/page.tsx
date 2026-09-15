"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Upload, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getLocalProfile } from "@/lib/profile";
import { getCourses } from "@/lib/api";
import { mockCourses } from "@/lib/mock-data";
import type { Course } from "@/types";

export default function DashboardPage() {
  const [name, setName] = useState("Student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  useEffect(() => {
    const profile = getLocalProfile();
    if (profile?.name) setName(profile.name);

    getCourses()
      .then((data) => setCourses(data.length ? data : mockCourses))
      .catch(() => {
        // Backend isn't reachable yet — fall back to sample data so the
        // frontend can keep being built without waiting on it.
        setCourses(mockCourses);
        setUsingMockData(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">
            {greeting}, {name}.
          </h1>
          <p className="mt-1 text-ink-muted">
            Here&apos;s what your learning looks like today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/library">
            <Button variant="outline">
              <Upload className="h-4 w-4" /> Upload material
            </Button>
          </Link>
          <Button variant="secondary">
            <Sparkles className="h-4 w-4" /> Ask AI
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-muted">Your courses</h2>
          {usingMockData && (
            <span className="rounded-full bg-amber/15 px-3 py-1 text-xs text-amber-dark">
              Showing sample data — backend not connected yet
            </span>
          )}
        </div>

        {loading && <p className="text-sm text-ink-muted">Loading courses…</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  {course.code}
                </p>
                <h3 className="mt-1 font-serif text-lg text-ink">{course.name}</h3>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <ProgressBar value={course.progress} />
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-forest">
                  Open course <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}