"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  schoolId: string;
  studentId: string;
  paymentId: string;
  parentId: string;
  amountClaimed: number;
  onUploaded?: () => void;
}

export function ReceiptUploadField({
  schoolId,
  studentId,
  paymentId,
  parentId,
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
    const path = `${schoolId}/parents/${parentId}/${paymentId}/${Date.now()}-${file.name}`;
    const supabase = createClient();
    const { error: upErr } = await supabase.storage.from("school-receipts").upload(path, file);

    if (upErr) {
      setBusy(false);
      return setError(upErr.message);
    }

    const { data: { publicUrl } } = supabase.storage.from("school-receipts").getPublicUrl(path);
    const user = (await supabase.auth.getUser()).data.user;

    const { error: dbErr } = await supabase.from("payment_receipt_uploads").insert({
      schoolid: schoolId,
      payment_id: paymentId,
      student_id: studentId,
      parent_id: parentId,
      uploaded_by: user?.id || parentId,
      uploaded_by_role: "PARENT",
      file_url: publicUrl,
      file_path: path,
      file_type: file.type,
      file_size_kb: Math.round(file.size / 1024),
      amount_claimed: amountClaimed,
      status: "PENDING",
    });

    setBusy(false);
    if (dbErr) {
      return setError(dbErr.message);
    }

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
