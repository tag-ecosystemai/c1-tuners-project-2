import type { StudyPlan } from "@/types";

const KEY = "sabilearn-latest-plan";

export function saveLatestPlan(plan: StudyPlan, courseLabel: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify({ plan, courseLabel }));
}

export function getLatestPlan(): { plan: StudyPlan; courseLabel: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}