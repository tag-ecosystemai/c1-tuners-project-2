"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Upload, FolderOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadModal } from "@/components/materials/upload-modal";
import { getCourses, createCourse } from "@/lib/api";
import { mockCourses, mockMaterials } from "@/lib/mock-data";
import type { Course } from "@/types";

export default function LibraryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [uploadForCourse, setUploadForCourse] = useState<string | null>(null);

  useEffect(() => {
    getCourses()
      .then((data) => {
        const list = data.length ? data : mockCourses;
        setCourses(list);
        const counts: Record<string, number> = {};
        list.forEach((c) => (counts[c.id] = mockMaterials[c.id]?.length ?? 0));
        setMaterialCounts(counts);
      })
      .catch(() => {
        setCourses(mockCourses);
        const counts: Record<string, number> = {};
        mockCourses.forEach((c) => (counts[c.id] = mockMaterials[c.id]?.length ?? 0));
        setMaterialCounts(counts);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  const addCourse = async () => {
    if (!newCode.trim() || !newName.trim()) return;
    try {
      const created = await createCourse(newCode, newName);
      setCourses((prev) => [...prev, created]);
    } catch {
      // Backend offline — add it locally so the flow still works
      setCourses((prev) => [
        ...prev,
        { id: crypto.randomUUID(), code: newCode, name: newName, progress: 0 },
      ]);
    }
    setNewCode("");
    setNewName("");
    setShowAddCourse(false);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">My Library</h1>
          <p className="mt-1 text-ink-muted">
            Your course materials, organized as folders.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowAddCourse(true)}>
          <Plus className="h-4 w-4" /> Add course
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-full border border-border bg-cream-card px-4 py-2.5 text-sm text-ink-muted">
        <Search className="h-4 w-4" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your materials…"
          className="flex-1 bg-transparent outline-none placeholder:text-ink-muted"
        />
      </div>

      {showAddCourse && (
        <Card className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-ink-muted">Code</label>
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="CSC 301"
              className="w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </div>
          <div className="flex-[2]">
            <label className="mb-1 block text-xs font-medium text-ink-muted">Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Artificial Intelligence"
              className="w-full rounded-xl border border-border bg-cream px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={addCourse}>Create</Button>
            <Button variant="ghost" onClick={() => setShowAddCourse(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-8">
        {loading && <p className="text-sm text-ink-muted">Loading…</p>}

        {!loading && filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="h-6 w-6 text-ink-muted" />
            <p className="mt-3 text-ink">No courses match &quot;{query}&quot;</p>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <Link href={`/courses/${course.id}`}>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  {course.code}
                </p>
                <h3 className="mt-1 font-serif text-lg text-ink">{course.name}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {materialCounts[course.id] ?? 0} materials
                </p>
              </Link>
              <button
                onClick={() => setUploadForCourse(course.id)}
                className="mt-4 flex items-center gap-1.5 self-start text-sm font-medium text-forest hover:underline"
              >
                <Upload className="h-3.5 w-3.5" /> Upload material
              </button>
            </Card>
          ))}
        </div>
      </div>

      {uploadForCourse && (
        <UploadModal
          courseId={uploadForCourse}
          onClose={() => setUploadForCourse(null)}
          onUploaded={() => {
            setMaterialCounts((prev) => ({
              ...prev,
              [uploadForCourse]: (prev[uploadForCourse] ?? 0) + 1,
            }));
            setUploadForCourse(null);
          }}
        />
      )}
    </div>
  );
}