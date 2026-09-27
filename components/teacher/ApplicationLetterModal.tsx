'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, CheckCircle2, X, Loader2, AlertCircle } from 'lucide-react'
import { CvUploadField } from '@/components/uploads/CvUploadField'
import { updateTeacherApplicationLetterAction } from '@/app/actions/teacher'

interface ApplicationLetterModalProps {
  teacherId: string
  schoolId: string
  existingLetterUrl?: string | null
  existingLetterText?: string | null
}

export function ApplicationLetterModal({
  teacherId,
  schoolId,
  existingLetterUrl,
  existingLetterText
}: ApplicationLetterModalProps) {
  const [isOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<'TYPE' | 'PDF'>('TYPE')
  const [letterText, setLetterText] = useState(existingLetterText || '')
  const [pdfUrl, setPdfUrl] = useState(existingLetterUrl || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trigger modal if neither application letter PDF nor typed text exists
  useEffect(() => {
    const hasSubmitted = Boolean(existingLetterUrl || (existingLetterText && existingLetterText.trim().length > 10))
    if (!hasSubmitted) {
      setIsModalOpen(true)
    }
  }, [existingLetterUrl, existingLetterText])

  // Handle Escape key to dismiss modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mode === 'TYPE' && (!letterText || letterText.trim().length < 10)) {
      setError('Please enter your application letter text.')
      return
    }

    if (mode === 'PDF' && !pdfUrl) {
      setError('Please upload an application letter PDF file.')
      return
    }

    setLoading(true)

    try {
      const res = await updateTeacherApplicationLetterAction({
        teacherId,
        applicationLetterUrl: mode === 'PDF' ? pdfUrl : null,
        applicationLetterText: mode === 'TYPE' ? letterText : null
      })

      if (!res.success) {
        setError(res.error || 'Failed to save application letter.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        setIsModalOpen(false)
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your application letter.')
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-letter-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <Card className="max-w-xl w-full border border-purple-500/30 shadow-2xl rounded-[2.5rem] bg-slate-950 text-white overflow-hidden relative">
        <button
          type="button"
          onClick={() => setIsModalOpen(false)}
          aria-label="Dismiss application letter modal"
          title="Dismiss for this session"
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <CardHeader className="p-8 pb-4 text-center">
          <div className="mx-auto bg-purple-500/20 border border-purple-500/40 p-4 rounded-full w-fit mb-3 text-purple-400">
            <FileText className="w-8 h-8" aria-hidden="true" />
          </div>
          <CardTitle id="app-letter-modal-title" className="text-2xl font-black text-white">Application Letter Required</CardTitle>
          <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-wider mt-1">
            Faculty Compliance Requirement
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 pt-2 space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium leading-relaxed">
            Please submit your formal application letter to complete your educator profile. You can either type your letter directly or upload a PDF document.
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="p-6 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
              <CheckCircle2 className="w-12 h-12 mx-auto" />
              <p className="font-black text-base">Application Letter Saved Successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Method Switcher */}
              <div className="flex rounded-2xl bg-slate-900 p-1.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMode('TYPE')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition ${
                    mode === 'TYPE' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Type Application Letter
                </button>
                <button
                  type="button"
                  onClick={() => setMode('PDF')}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs transition ${
                    mode === 'PDF' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload PDF Document
                </button>
              </div>

              {mode === 'TYPE' ? (
                <div className="space-y-2">
                  <Label htmlFor="app-letter-text" className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Application Letter Content
                  </Label>
                  <textarea
                    id="app-letter-text"
                    rows={7}
                    placeholder="Type your formal application letter here..."
                    value={letterText}
                    onChange={(e) => setLetterText(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-slate-800 bg-slate-900 text-white text-xs font-medium focus:outline-none focus:border-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500 transition leading-relaxed"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <CvUploadField
                    schoolId={schoolId || 'school-elgoodnews-001'}
                    userId={teacherId}
                    role="teachers"
                    label="Application Letter PDF"
                    existingUrl={pdfUrl}
                    onUploaded={(publicUrl) => setPdfUrl(publicUrl)}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-slate-800 bg-slate-900 text-slate-400 hover:text-white h-12 rounded-2xl font-bold text-xs"
                >
                  REMIND ME LATER
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white h-12 rounded-2xl font-black text-xs shadow-xl shadow-purple-600/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'SAVE APPLICATION LETTER'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
