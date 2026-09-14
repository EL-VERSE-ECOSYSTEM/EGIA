"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoUploadField({
  schoolId,
  existingUrl,
  onUploaded,
}: {
  schoolId: string;
  existingUrl?: string | null;
  onUploaded: (url: string, path: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!["image/png", "image/jpeg", "image/svg+xml", "image/webp"].includes(file.type)) {
      return setError("Only PNG, JPEG, SVG, or WebP allowed");
    }
    if (file.size > 2 * 1024 * 1024) {
      return setError("Max 2 MB allowed");
    }

    setBusy(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${schoolId || "temp"}/logo-${Date.now()}.${ext}`;
    const supabase = createClient();
    const { error: upErr } = await supabase.storage.from("school-logos").upload(path, file);

    setBusy(false);
    if (upErr) {
      return setError(upErr.message);
    }

    const { data: { publicUrl } } = supabase.storage.from("school-logos").getPublicUrl(path);
    setPreview(publicUrl);
    onUploaded(publicUrl, path);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        School Logo (PNG/JPEG/SVG, max 2MB)
      </label>
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
      />
      {busy && <p className="text-sm text-purple-600 animate-pulse">Uploading logo...</p>}
      {preview && (
        <div className="mt-2 flex items-center gap-3">
          <img src={preview} alt="School Logo Preview" className="h-16 w-16 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shadow-sm" />
          <span className="text-xs text-emerald-600 font-medium">✓ Logo ready</span>
        </div>
      )}
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
}
