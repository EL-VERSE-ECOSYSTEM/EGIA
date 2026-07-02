'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Upload, FileText, Loader2, CheckCircle,
  Trash2, Edit3, Shield, Search, Zap
} from 'lucide-react'
import { extractQuestionsFromPDF, SimulatedQuestion } from '@/app/actions/ai-parsing'
import { saveAssessmentWithQuestions } from '@/app/actions/assessments'
import { getTeacherProfile } from '@/app/actions/teacher'
import { useRouter } from 'next/navigation'

export default function AIConversionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<SimulatedQuestion[]>([])
  const [teacher, setTeacher] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Assessment Metadata
  const [title, setTitle] = useState('New AI Generated Assessment')
  const [duration, setDuration] = useState('60')
  const [subjectId, setSubjectId] = useState('')

  useEffect(() => {
    getTeacherProfile().then(setTeacher)
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLoading(true)
      try {
        const result = await extractQuestionsFromPDF('mock-base64')
        setQuestions(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSave = async () => {
    if (!subjectId) return alert('Please select a subject')
    setIsSaving(true)
    try {
      await saveAssessmentWithQuestions({
        title,
        duration: parseInt(duration),
        subjectId,
        teacherId: teacher.id,
        termId: 'current-term-id', // Simulation
        type: 'EXAM'
      }, questions)
      router.push('/dashboard/teacher/assessments')
    } catch (err) {
      console.error(err)
      alert('Failed to save assessment')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-10 max-w-6xl mx-auto min-h-screen bg-slate-50/30">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">AI PDF to CBT Converter</h1>
          <p className="text-slate-500 text-lg font-medium">
            Transform your PDF exam papers into interactive digital CBT assessments in seconds.
          </p>
        </div>

        {!questions.length ? (
          <div className="grid lg:grid-cols-3 gap-10">
            <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardContent className="p-12">
                <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-16 text-center hover:border-purple-200 hover:bg-purple-50/30 transition-all cursor-pointer group relative">
                  {loading ? (
                    <div className="py-10">
                      <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse shadow-xl shadow-purple-900/5">
                        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 mb-4 italic">Analyzing Layout...</h2>
                      <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">
                        PaddleOCR + Groq Llama3 Engine Active
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-purple-900/5">
                        <Upload className="w-10 h-10 text-purple-600" />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 mb-4">Click to Upload PDF</h2>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                        Support for mixed Multiple Choice, Fill-in-the-gap, and True/False questions.
                      </p>

                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        id="pdf-upload"
                        accept=".pdf"
                        onChange={handleFileUpload}
                      />
                      <Button size="lg" className="bg-purple-600 hover:bg-purple-700 h-16 px-10 rounded-2xl font-black text-lg shadow-xl shadow-purple-200 transition-all">
                        Select Exam Paper
                      </Button>
                    </>
                  )}
                </div>

                <div className="mt-12 flex items-center justify-center gap-10 grayscale opacity-40">
                  <div className="flex items-center gap-2 font-black text-slate-500">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Groq AI
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                  <div className="flex items-center gap-2 font-black text-slate-500">
                    <Search className="w-5 h-5 text-blue-500" /> PaddleOCR
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                  <div className="flex items-center gap-2 font-black text-slate-500">
                    <Shield className="w-5 h-5 text-emerald-500" /> DeepSeek
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] p-8 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <FileText className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-black mb-6">How it works</h3>
                <div className="space-y-6 relative z-10">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black text-xs shrink-0">1</div>
                    <p className="text-sm text-slate-300 font-medium">Upload your PDF containing questions and answers.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black text-xs shrink-0">2</div>
                    <p className="text-sm text-slate-300 font-medium">Our AI extracts text and identifies question patterns.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black text-xs shrink-0">3</div>
                    <p className="text-sm text-slate-300 font-medium">Review and edit the parsed questions in real-time.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] p-10 bg-white">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Assessment Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-xl border-slate-100 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Subject</label>
                  <Select onValueChange={setSubjectId}>
                    <SelectTrigger className="h-14 rounded-xl border-slate-100 font-bold">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacher?.subjects?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                      <SelectItem value="GEN-MATH">Mathematics</SelectItem>
                      <SelectItem value="GEN-ENG">English Language</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Duration (Mins)</label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-14 rounded-xl border-slate-100 font-bold" />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-2xl">
                  <CheckCircle className="text-emerald-600 w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Extracted {questions.length} Questions</h2>
                  <p className="text-slate-500 font-bold text-sm">Overall Confidence: 94%</p>
                </div>
              </div>
              <div className="flex gap-3">
                 <Button variant="outline" className="rounded-xl font-black h-12 border-slate-200" onClick={() => setQuestions([])}>
                   Clear & Restart
                 </Button>
                 <Button
                   onClick={handleSave}
                   disabled={isSaving}
                   className="bg-purple-600 hover:bg-purple-700 rounded-xl font-black h-12 px-8 shadow-lg shadow-purple-100"
                 >
                   {isSaving ? 'Saving...' : 'Finalize & Publish'}
                 </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {questions.map((q, idx) => (
                <Card key={q.id} className="border-none shadow-xl shadow-slate-100 rounded-[2rem] overflow-hidden bg-white">
                  <div className="h-2 bg-purple-500" />
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <span className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-900">
                           {idx + 1}
                         </span>
                         <Badge className="bg-purple-50 text-purple-600 border-purple-100 rounded-lg font-black uppercase tracking-tighter py-1">
                           {q.type.replace('_', ' ')}
                         </Badge>
                         <Badge variant="outline" className="text-slate-400 font-black">
                           {(q.confidence * 100).toFixed(0)}% Match
                         </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-purple-600 rounded-xl">
                          <Edit3 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 rounded-xl">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-xl font-bold text-slate-800 mb-6 leading-relaxed">
                      {q.question}
                    </p>

                    {q.options && (
                      <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {q.options.map((opt, i) => (
                          <div
                            key={i}
                            className={`p-4 rounded-2xl border-2 ${q.answer === opt ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-slate-100 text-slate-600'} font-bold flex items-center gap-3`}
                          >
                            <span className="w-8 h-8 rounded-lg bg-white/50 flex items-center justify-center text-xs">
                              {String.fromCharCode(65 + i)}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Detected Answer</p>
                      <p className="text-emerald-600 font-black text-lg">
                        {Array.isArray(q.answer) ? q.answer.join(', ') : q.answer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
