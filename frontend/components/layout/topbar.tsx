"use client";

import { Bell, Search } from "lucide-react";
import { getLocalProfile } from "@/lib/profile";
import { useEffect, useState } from "react";

export function Topbar() {
  const [name, setName] = useState("Student");

  useEffect(() => {
    const profile = getLocalProfile();
    if (profile?.name) setName(profile.name);
  }, []);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-cream px-6">
      <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-cream-card px-4 py-2 text-sm text-ink-muted">
        <Search className="h-4 w-4" />
        <span>Search courses, notes, or topics</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-cream-card">
          <Bell className="h-4 w-4 text-ink-muted" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-sm font-medium text-white">
            {initials}
          </div>
          <span className="text-sm font-medium">{name}</span>
        </div>
      </div>
    </header>
  );
}
