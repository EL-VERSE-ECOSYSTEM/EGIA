'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Upload, Edit3, FileSpreadsheet, Loader2, CheckCircle2, Download, AlertCircle } from 'lucide-react'
import { createLessonNote } from '@/app/actions/library'
import { AdvancedCSVUploader } from '@/components/csv/AdvancedCSVUploader'
import { toast } from 'sonner'

interface LessonNoteUploaderProps {
  onSuccess?: () => void
  userRole?: string
  defaultAuthor?: string
}

export function LessonNoteUploader({ onSuccess, userRole = 'Teacher', defaultAuthor = 'Academy Instructor' }: LessonNoteUploaderProps) {
  const [activeTab, setActiveTab] = useState<'pdf' | 'manual' | 'csv'>('manual')
  const [loading, setLoading] = useState(false)

  // Manual Typing State
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [author, setAuthor] = useState(defaultAuthor)
  const [category, setCategory] = useState('Lesson Notes')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')

  // PDF Upload State
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfTitle, setPdfTitle] = useState('')
  const [pdfSubject, setPdfSubject] = useState('')
  const [pdfClassLevel, setPdfClassLevel] = useState('')
  const [pdfAuthor, setPdfAuthor] = useState(defaultAuthor)
  const [pdfDescription, setPdfDescription] = useState('')
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a valid PDF document.')
        return
      }
      setPdfFile(file)
      if (!pdfTitle) setPdfTitle(file.name.replace(/\.pdf$/i, ''))

      const reader = new FileReader()
      reader.onload = (evt) => {
        setPdfBase64(evt.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !subject || !classLevel || !content) {
      toast.error('Please fill in all required fields (Title, Subject, Class Level, Content).')
      return
    }

    setLoading(true)
    try {
      const res = await createLessonNote({
        title,
        subject,
        classLevel,
        author: author || defaultAuthor,
        category,
        content,
        description: description || content.slice(0, 200),
        isDigital: true
      })

      if (res.success) {
        toast.success('Lesson Note published to Library in real time!')
        setTitle('')
        setSubject('')
        setClassLevel('')
        setContent('')
        setDescription('')
        if (onSuccess) onSuccess()
      } else {
        toast.error(res.error || 'Failed to publish lesson note.')
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pdfFile || !pdfTitle || !pdfSubject || !pdfClassLevel) {
      toast.error('Please attach a PDF file and complete required fields.')
      return
    }

    setLoading(true)
    try {
      // 1. Upload PDF to Supabase Storage Bucket
      const uploadFormData = new FormData()
      uploadFormData.append('file', pdfFile)

      const uploadRes = await fetch('/api/library/lesson-notes/upload-pdf', {
        method: 'POST',
        body: uploadFormData
      })

      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.success) {
        toast.error(uploadData.error || 'Failed to upload PDF to Supabase Storage bucket.')
        setLoading(false)
        return
      }

      // 2. Save Lesson Note Record to Supabase Tables
      const res = await createLessonNote({
        title: pdfTitle,
        subject: pdfSubject,
        classLevel: pdfClassLevel,
        author: pdfAuthor || defaultAuthor,
        category: 'Lesson Notes (PDF)',
        content: pdfDescription || `PDF Document Note: ${pdfFile.name}`,
        description: pdfDescription || `Uploaded PDF document note: ${pdfFile.name}`,
        fileUrl: uploadData.fileUrl,
        storagePath: uploadData.storagePath,
        fileSize: uploadData.fileSize,
        isPdf: true,
        isDigital: true
      })

      if (res.success) {
        toast.success('PDF Lesson Note uploaded to Supabase Storage and synced in real time!')
        setPdfFile(null)
        setPdfTitle('')
        setPdfSubject('')
        setPdfClassLevel('')
        setPdfDescription('')
        setPdfBase64(null)
        if (onSuccess) onSuccess()
      } else {
        toast.error(res.error || 'Failed to upload PDF lesson note.')
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred uploading PDF to storage bucket.')
    } finally {
      setLoading(false)
    }
  }

  const downloadCSVTemplate = () => {
    const headers = ['Title', 'Subject', 'Class', 'Author', 'Category', 'Content/Description']
    const sampleRow = [
      'Photosynthesis and Plant Nutrition Notes',
      'Biology',
      'SSS 2',
      'Dr. T. U. Ndu',
      'Lesson Notes',
      'Photosynthesis process, light and dark reaction stages, stomata function...'
    ]

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), sampleRow.join(',')].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "lesson_notes_import_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="p-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <CardTitle className="text-2xl font-black flex items-center gap-2">
            <FileText className="w-6 h-6 text-orange-500" /> Upload Lesson Note to Library
          </CardTitle>
          <CardDescription className="text-slate-400 font-bold text-xs mt-1">
            Real-time synchronization with Supabase Database for Admin, Teachers, and Students/Pupils.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={downloadCSVTemplate}
            variant="outline"
            className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl h-10 gap-1.5"
          >
            <Download className="w-4 h-4 text-orange-400" /> CSV Template
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full space-y-6">
          <TabsList className="grid grid-cols-3 bg-slate-100 p-1.5 rounded-2xl h-14">
            <TabsTrigger
              value="manual"
              className="rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600"
            >
              <Edit3 className="w-4 h-4" /> Manual Typing
            </TabsTrigger>
            <TabsTrigger
              value="pdf"
              className="rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600"
            >
              <Upload className="w-4 h-4" /> PDF Document
            </TabsTrigger>
            <TabsTrigger
              value="csv"
              className="rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600"
            >
              <FileSpreadsheet className="w-4 h-4" /> Bulk CSV Import
            </TabsTrigger>
          </TabsList>

          {/* MANUAL TYPING TAB */}
          <TabsContent value="manual" className="space-y-6">
            <form onSubmit={handleManualSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Lesson Note Title *</Label>
                  <Input
                    placeholder="e.g. Introduction to Quadratic Equations"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Subject *</Label>
                  <Input
                    placeholder="e.g. Mathematics, Biology, English"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Class Level *</Label>
                  <Input
                    placeholder="e.g. SSS 1, Primary 5, JSS 2"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Author / Teacher</Label>
                  <Input
                    placeholder="Author name"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Category</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="Lesson Notes">Lesson Notes</option>
                    <option value="Class Notes">Class Notes</option>
                    <option value="Revision Material">Revision Material</option>
                    <option value="Study Guides">Study Guides</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Short Summary / Description</Label>
                <Input
                  placeholder="Brief summary of topics covered in this note"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Full Lesson Note Content *</Label>
                <Textarea
                  placeholder="Type or paste full lesson note content here (definitions, key points, formulas, examples)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  required
                  className="rounded-2xl border-slate-200 focus:ring-2 focus:ring-orange-500 font-medium leading-relaxed p-4"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-xl shadow-orange-100 transition-all text-base gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                PUBLISH LESSON NOTE TO LIBRARY (REAL TIME)
              </Button>
            </form>
          </TabsContent>

          {/* PDF UPLOAD TAB */}
          <TabsContent value="pdf" className="space-y-6">
            <form onSubmit={handlePdfSubmit} className="space-y-5">
              <div className="border-2 border-dashed border-orange-200 bg-orange-50/40 rounded-3xl p-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    {pdfFile ? pdfFile.name : 'Select or drop PDF Lesson Note Document'}
                  </p>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    {pdfFile ? `${(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Document` : 'Maximum filesize 25MB'}
                  </p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfFileChange}
                  className="hidden"
                  id="pdfUploadInput"
                />
                <label
                  htmlFor="pdfUploadInput"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all"
                >
                  <Upload className="w-4 h-4" />
                  {pdfFile ? 'Change PDF File' : 'Browse PDF File'}
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Document Title *</Label>
                  <Input
                    placeholder="e.g. Complete Chemistry Organic Notes"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Subject *</Label>
                  <Input
                    placeholder="e.g. Chemistry, Physics"
                    value={pdfSubject}
                    onChange={(e) => setPdfSubject(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Class Level *</Label>
                  <Input
                    placeholder="e.g. SSS 2"
                    value={pdfClassLevel}
                    onChange={(e) => setPdfClassLevel(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase text-slate-500">Author</Label>
                  <Input
                    placeholder="Author name"
                    value={pdfAuthor}
                    onChange={(e) => setPdfAuthor(e.target.value)}
                    className="h-12 rounded-xl border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-500">Description / Extract Summary</Label>
                <Textarea
                  placeholder="Provide an extract summary or table of contents of this PDF note..."
                  value={pdfDescription}
                  onChange={(e) => setPdfDescription(e.target.value)}
                  rows={4}
                  className="rounded-2xl border-slate-200 font-medium p-4"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !pdfFile}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-orange-100 transition-all text-base gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                UPLOAD PDF LESSON NOTE (REAL TIME)
              </Button>
            </form>
          </TabsContent>

          {/* BULK CSV IMPORT TAB */}
          <TabsContent value="csv" className="space-y-6">
            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs font-bold text-orange-900 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-orange-600" />
              Upload bulk lesson notes via CSV. Your file should include headers: Title, Subject, Class, Author, Category, Content.
            </div>
            <AdvancedCSVUploader mode="lesson-notes" onDataLoaded={() => {
              toast.success('CSV Lesson Notes imported successfully!')
              if (onSuccess) onSuccess()
            }} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
