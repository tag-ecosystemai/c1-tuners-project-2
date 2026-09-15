"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudyPlan } from "@/lib/api";
import { getLatestPlan } from "@/lib/study-plan-store";
import type { StudyPlan } from "@/types";

export function StudyPlanView() {
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [courseLabel, setCourseLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [tasksDone, setTasksDone] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getStudyPlan()
      .then((res) => {
        if (res.days?.length) {
          setPlan(res);
        } else {
          const local = getLatestPlan();
          if (local) {
            setPlan(local.plan);
            setCourseLabel(local.courseLabel);
          }
        }
      })
      .catch(() => {
        const local = getLatestPlan();
        if (local) {
          setPlan(local.plan);
          setCourseLabel(local.courseLabel);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-ink-muted">Loading…</p>;

  if (!plan) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-light">
          <Target className="h-5 w-5 text-forest" />
        </div>
        <h2 className="mt-4 font-serif text-xl text-ink">No plan yet</h2>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          Ask the Study Agent to prepare you for an exam, and your plan will show up here.
        </p>
        <Link href="/study-agent" className="mt-5">
          <Button>
            <Sparkles className="h-4 w-4" /> Open Study Agent
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {courseLabel || "Your active plan"}
        </p>
        <Link href="/study-agent">
          <Button variant="outline" size="sm">
            <Sparkles className="h-3.5 w-3.5" /> Ask AI to adjust my plan
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {plan.days.map((day) => (
          <Card key={day.day}>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Day {day.day}
            </p>
            <h3 className="mt-1 font-serif text-lg text-ink">{day.topic}</h3>
            <div className="mt-3 space-y-2">
              {day.tasks.map((task) => (
                <label key={task.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={tasksDone[task.id] ?? task.done}
                    onChange={(e) =>
                      setTasksDone((prev) => ({ ...prev, [task.id]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-border accent-forest"
                  />
                  <span
                    className={tasksDone[task.id] ? "text-ink-muted line-through" : "text-ink"}
                  >
                    {task.label}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}