import type { OnboardingData } from "@/types";

const KEY = "sabilearn-profile";

export function saveLocalProfile(data: OnboardingData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getLocalProfile(): OnboardingData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export function hasCompletedOnboarding(): boolean {
  return getLocalProfile() !== null;
}
