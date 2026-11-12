"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { submitManualPayment } from "@/app/actions/payments";

interface Props {
  schoolId: string;
  studentId: string;
  parentId: string;
  feeType: string;
  amountClaimed: number;
  onUploaded?: () => void;
}

export function ReceiptUploadField({
  schoolId,
  studentId,
  parentId,
  feeType,
  amountClaimed,
  onUploaded,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setSuccess(false);

    const allowed = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return setError("Only PNG, JPEG, or PDF allowed");
    }
    if (file.size > 5 * 1024 * 1024) {
      return setError("Max 5 MB allowed");
    }

    setBusy(true);
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setBusy(false);
      return setError("Sign in again before uploading your receipt.");
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "receipt";
    const path = `${schoolId}/${studentId}/${parentId}/${crypto.randomUUID()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("school-receipts").upload(path, file);

    if (upErr) {
      setBusy(false);
      return setError(upErr.message);
    }

    const { data: { publicUrl } } = supabase.storage.from("school-receipts").getPublicUrl(path);
    try {
      await submitManualPayment({
        studentId,
        feeType,
        amount: amountClaimed.toFixed(2),
        receiptUrl: publicUrl,
        fileType: file.type,
      });
    } catch (err) {
      await supabase.storage.from("school-receipts").remove([path]);
      setBusy(false);
      return setError(err instanceof Error ? err.message : "Could not submit receipt.");
    }

    setBusy(false);

    setSuccess(true);
    onUploaded?.();
  }

  return (
    <div className="space-y-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
      <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
        Upload Payment Receipt (PNG, JPEG, or PDF - Max 5MB)
      </label>
      <input
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        disabled={busy}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
      />
      {busy && <p className="text-xs text-emerald-600 animate-pulse font-bold">Uploading receipt...</p>}
      {success && <p className="text-xs text-emerald-600 font-bold">✓ Receipt submitted — awaiting admin confirmation</p>}
      {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
    </div>
  );
}
