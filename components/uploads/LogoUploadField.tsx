"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface LogoUploadFieldProps {
  schoolId: string;
  existingUrl?: string | null;
  onUploaded: (publicUrl: string, storagePath: string) => void;
  onRemoved?: () => void;
}

export function LogoUploadField({
  schoolId,
  existingUrl,
  onUploaded,
  onRemoved,
}: LogoUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    const allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type)) {
      return setError("Only PNG, JPEG, SVG, or WebP allowed");
    }
    if (file.size > 2 * 1024 * 1024) {
      return setError("Max 2 MB");
    }

    // Instant client-side preview via FileReader
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const folder = schoolId ? schoolId : "registration";
      const path = `${folder}/logo-${Date.now()}.${ext}`;
      const supabase = createClient();

      const { error: upErr } = await supabase.storage
        .from("school-logos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (upErr) {
        setBusy(false);
        return setError(upErr.message);
      }

      const { data: { publicUrl } } = supabase.storage.from("school-logos").getPublicUrl(path);

      setPreview(publicUrl);
      setProgress(100);
      onUploaded(publicUrl, path);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during logo upload");
    } finally {
      setBusy(false);
    }
  }

  function removeLogo() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemoved?.();
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        School Logo <span className="text-red-500">*</span>
      </label>

      {preview && (
        <div className="flex items-center gap-4 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900">
          <img
            src={preview}
            alt="School logo preview"
            className="h-16 w-16 rounded-lg object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
          />
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Logo Preview</p>
            <p className="text-[11px] text-slate-500">PNG, JPEG, SVG, WebP (max 2 MB)</p>
          </div>
          <button
            type="button"
            onClick={removeLogo}
            className="text-xs font-black text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
      />

      {busy && <p className="text-xs text-purple-600 font-bold animate-pulse">Uploading logo...</p>}
      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
    </div>
  );
}
