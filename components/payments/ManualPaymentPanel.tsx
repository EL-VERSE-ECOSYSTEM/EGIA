"use client";

import { useState } from "react";
import { ReceiptUploadField } from "@/components/payments/ReceiptUploadField";
import { Building, Copy, Check, ExternalLink, Info } from "lucide-react";

interface Props {
  config: {
    bank_name?: string | null;
    account_number?: string | null;
    account_name?: string | null;
    custom_payment_link?: string | null;
    instructions?: string | null;
  } | null;
  amount: number;
  schoolId: string;
  studentId: string;
  paymentId: string;
  parentId: string;
  onReceiptUploaded?: () => void;
}

export function ManualPaymentPanel({
  config,
  amount,
  schoolId,
  studentId,
  paymentId,
  parentId,
  onReceiptUploaded,
}: Props) {
  const [copied, setCopied] = useState(false);

  const copyAccount = () => {
    if (config?.account_number) {
      navigator.clipboard.writeText(config.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
          <Building className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900">Direct Bank Transfer / External Payment</h2>
          <p className="text-xs text-slate-500 font-medium">Transfer directly to the school account below</p>
        </div>
      </div>

      <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Amount Owed</span>
          <p className="text-2xl font-black text-emerald-700">NGN {amount.toLocaleString()}</p>
        </div>
        <span className="text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">Manual Clearance</span>
      </div>

      {/* Bank Account Details */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <span className="text-slate-500 font-sans">Bank Name:</span>
          <span className="font-bold text-slate-900">{config?.bank_name || "School Bank"}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <span className="text-slate-500 font-sans">Account Name:</span>
          <span className="font-bold text-slate-900">{config?.account_name || "School Account"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500 font-sans">Account Number:</span>
          <div className="flex items-center gap-2">
            <span className="font-black text-purple-700 text-sm">{config?.account_number || "—"}</span>
            {config?.account_number && (
              <button
                type="button"
                onClick={copyAccount}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Payment Link */}
      {config?.custom_payment_link && (
        <a
          href={config.custom_payment_link}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition"
        >
          <span>Pay Via Custom Payment Link</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      )}

      {/* Payment Instructions */}
      {config?.instructions && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs font-medium">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>{config.instructions}</p>
        </div>
      )}

      {/* Upload Receipt Section */}
      <ReceiptUploadField
        schoolId={schoolId}
        studentId={studentId}
        paymentId={paymentId}
        parentId={parentId}
        amountClaimed={amount}
        onUploaded={onReceiptUploaded}
      />
    </div>
  );
}
