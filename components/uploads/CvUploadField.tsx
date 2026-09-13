'use client'

import React, { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FileText, Upload, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react'

export interface CvUploadFieldProps {
  schoolId: string
  userId: string
  role: 'teachers' | 'institutional-staff' | 'admins'
  label?: string
  existingUrl?: string | null
  onUploaded: (publicUrl: string, path: string) => void
  onError?: (err: Error) => void
  maxSizeMB?: number
  required?: boolean
}

export function CvUploadField({
  schoolId,
  userId,
  role,
  label = 'CV / Application Letter (PDF)',
  existingUrl,
  onUploaded,
  onError,
  maxSizeMB = 5,
  required = false
}: CvUploadFieldProps) {
  const [progress, setProgress] = useState(0)
  const [url, setUrl] = useState<string | null>(existingUrl ?? null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    setError(null)
    if (file.type !== 'application/pdf') {
      const err = new Error('Only PDF documents (.pdf) are allowed.')
      setError(err.message)
      if (onError) onError(err)
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      const err = new Error(`File size exceeds maximum allowed limit of ${maxSizeMB}MB.`)
      setError(err.message)
      if (onError) onError(err)
      return
    }

    setBusy(true)
    setProgress(20)

    try {
      const supabase = createClient()
      const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const cleanSchoolId = schoolId || 'default-school'
      const cleanUserId = userId || `temp-${Date.now()}`
      const path = `${cleanSchoolId}/${role}/${cleanUserId}/${safeLabel}-${Date.now()}.pdf`

      setProgress(50)

      const { error: upErr } = await supabase.storage
        .from('school-cvs')
        .upload(path, file, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (upErr) {
        setError(upErr.message)
        if (onError) onError(upErr)
        setBusy(false)
        return
      }

      setProgress(80)

      const { data: { publicUrl } } = supabase.storage
        .from('school-cvs')
        .getPublicUrl(path)

      setUrl(publicUrl)
      setProgress(100)
      onUploaded(publicUrl, path)
    } catch (err: any) {
      const e = err instanceof Error ? err : new Error('CV upload failed.')
      setError(e.message)
      if (onError) onError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-orange-500" />
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-[10px] font-bold text-slate-400">PDF ONLY (MAX {maxSizeMB}MB)</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
          id={`cv-input-${role}-${label.replace(/\s+/g, '-')}`}
        />
        <label
          htmlFor={`cv-input-${role}-${label.replace(/\s+/g, '-')}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin text-orange-400" /> : <Upload className="w-4 h-4 text-orange-400" />}
          {url ? 'Replace PDF Document' : 'Select PDF Document'}
        </label>

        {url && !busy && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>PDF Uploaded</span>
            <a href={url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline inline-flex items-center gap-1 ml-2">
              View PDF <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {busy && (
        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div className="bg-orange-500 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  )
}
