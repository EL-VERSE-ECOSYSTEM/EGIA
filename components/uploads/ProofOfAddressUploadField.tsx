"use client";

import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { FileText, Image as ImageIcon, Upload, CheckCircle2, Trash2, Link as LinkIcon } from "lucide-react";

interface ProofOfAddressUploadFieldProps {
  existingUrl?: string | null;
  onUploaded: (publicUrl: string) => void;
  onRemoved?: () => void;
}

export function ProofOfAddressUploadField({
  existingUrl,
  onUploaded,
  onRemoved,
}: ProofOfAddressUploadFieldProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(existingUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];
    if (!allowed.includes(file.type)) {
      return setError("Only PDF, PNG, JPG, or WebP files are allowed");
    }
    if (file.size > 10 * 1024 * 1024) {
      return setError("File size must be 10 MB or less");
    }

    setFileName(file.name);
    setFileType(file.type);
    setBusy(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `proof-of-address/doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const supabase = createClient();

      const { error: upErr } = await supabase.storage
        .from("school-documents")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (upErr) {
        setBusy(false);
        return setError(upErr.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("school-documents").getPublicUrl(path);

      setFileUrl(publicUrl);
      onUploaded(publicUrl);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during document upload");
    } finally {
      setBusy(false);
    }
  }

  function removeDocument() {
    setFileUrl(null);
    setFileName(null);
    setFileType(null);
    setManualInput("");
    if (inputRef.current) inputRef.current.value = "";
    onRemoved?.();
  }

  function handleManualUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setFileUrl(manualInput.trim());
    onUploaded(manualInput.trim());
  }

  const isPdf = fileType === "application/pdf" || fileUrl?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase text-slate-400">
          Proof of School Address (Electricity Bill, Utility Receipt, or Official Document) *
        </label>
        <button
          type="button"
          onClick={() => setManualMode(!manualMode)}
          className="text-[11px] font-bold text-blue-400 hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {manualMode ? "Upload File" : "Paste Document URL"}
        </button>
      </div>

      {fileUrl && (
        <div className="flex items-center gap-4 p-3.5 border border-emerald-500/30 rounded-2xl bg-emerald-500/10 text-emerald-300">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            {isPdf ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-white truncate">{fileName || "Proof of Address Document"}</p>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-semibold text-emerald-400 underline hover:text-emerald-300 block truncate mt-0.5"
            >
              View Uploaded Document
            </a>
          </div>
          <button
            type="button"
            onClick={removeDocument}
            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/20 transition"
            title="Remove document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {!fileUrl && !manualMode && (
        <div className="space-y-2">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center bg-slate-950/60 cursor-pointer transition flex flex-col items-center justify-center gap-2"
          >
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-200">
              Click or drag to upload Electricity Bill / Proof of Address
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Supports PDF, PNG, JPG, JPEG, and WebP (up to 10 MB)
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />
        </div>
      )}

      {!fileUrl && manualMode && (
        <form onSubmit={handleManualUrlSubmit} className="flex gap-2">
          <input
            type="url"
            required
            placeholder="https://... (Direct URL to electricity bill or utility document)"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Attach URL
          </button>
        </form>
      )}

      {busy && <p className="text-xs text-blue-400 font-bold animate-pulse">Uploading proof of address document to Supabase Storage...</p>}
      {error && <p className="text-xs text-rose-400 font-bold">{error}</p>}
    </div>
  );
}
