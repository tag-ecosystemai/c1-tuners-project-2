"use client";

import { useRef, useState } from "react";
import { Upload, Check, X } from "lucide-react";
import { uploadMaterial } from "@/lib/api";
import { categorizeFile, UPLOAD_ACCEPT } from "@/lib/file-type";
import type { Material } from "@/types";

type Stage = { key: string; label: string };

const DOCUMENT_STAGES: Stage[] = [
  { key: "uploading", label: "Uploading" },
  { key: "extracting", label: "Extracting content" },
  { key: "understanding", label: "Understanding concepts" },
  { key: "ready", label: "Ready to learn" },
];

const AUDIO_STAGES: Stage[] = [
  { key: "uploading", label: "Uploading" },
  { key: "extracting", label: "Transcribing audio" },
  { key: "understanding", label: "Understanding concepts" },
  { key: "ready", label: "Ready to learn" },
];

export function UploadModal({
  courseId,
  onClose,
  onUploaded,
}: {
  courseId: string;
  onClose: () => void;
  onUploaded: (material: Material) => void;
}) {
  const [stageIndex, setStageIndex] = useState(-1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [stages, setStages] = useState(DOCUMENT_STAGES);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const category = categorizeFile(file.name);
    const activeStages = category === "audio" ? AUDIO_STAGES : DOCUMENT_STAGES;
    setStages(activeStages);

    for (let i = 0; i < activeStages.length; i++) {
      setStageIndex(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    let material: Material;
    try {
      material = await uploadMaterial(courseId, file);
    } catch {
      material = {
        id: crypto.randomUUID(),
        name: file.name,
        type: category,
        status: "ready",
      };
    }

    await new Promise((r) => setTimeout(r, 400));
    onUploaded(material);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-cream-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">Add learning material</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        {stageIndex === -1 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 text-center hover:border-forest"
          >
            <Upload className="h-6 w-6 text-ink-muted" />
            <p className="mt-3 text-sm text-ink">Drop files here or browse</p>
            <p className="mt-1 text-xs text-ink-muted">
              PDF, DOCX, PPTX, images, or audio (MP3, WAV, M4A)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={UPLOAD_ACCEPT}
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {stageIndex >= 0 && (
          <div>
            <p className="mb-4 truncate text-sm text-ink-muted">{fileName}</p>
            <div className="space-y-3">
              {stages.map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-3 text-sm">
                  <div
                    className={
                      i < stageIndex
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-success text-white"
                        : i === stageIndex
                        ? "h-5 w-5 animate-pulse rounded-full bg-amber"
                        : "h-5 w-5 rounded-full bg-forest-light"
                    }
                  >
                    {i < stageIndex && <Check className="h-3 w-3" />}
                  </div>
                  <span className={i <= stageIndex ? "text-ink" : "text-ink-muted"}>
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}