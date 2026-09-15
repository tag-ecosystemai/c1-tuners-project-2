export type MaterialCategory = "pdf" | "docx" | "pptx" | "image" | "audio" | "file";

const EXTENSION_MAP: Record<string, MaterialCategory> = {
  pdf: "pdf",
  doc: "docx",
  docx: "docx",
  ppt: "pptx",
  pptx: "pptx",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  ogg: "audio",
  aac: "audio",
};

/**
 * Maps a filename (or a loose type string already in category form,
 * e.g. from the backend) to one of our known material categories.
 * Falls back to "file" for anything unrecognized rather than guessing.
 */
export function categorizeFile(nameOrType: string): MaterialCategory {
  const lower = nameOrType.toLowerCase();
  const ext = lower.includes(".") ? lower.split(".").pop()! : lower;
  return EXTENSION_MAP[ext] ?? (["pdf", "docx", "pptx", "image", "audio"].includes(ext) ? (ext as MaterialCategory) : "file");
}

// Accept string for the native file picker — broad, but audio explicitly included
export const UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.m4a,.ogg,.aac";