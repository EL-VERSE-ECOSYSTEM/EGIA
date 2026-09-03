'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, FileText, CheckCircle, AlertCircle, Table, ArrowRight, Database } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdvancedCSVUploader } from '@/components/csv/AdvancedCSVUploader'

export default function CSVImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentId = searchParams.get('assessmentId')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file || !assessmentId) {
      setMessage('Error: create or select an assessment before importing questions.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('assessmentId', assessmentId)

    try {
      const response = await fetch('/api/teacher/assessments/import-csv', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (result.success) {
        setMessage(`Successfully imported ${result.count} questions!`)
        setTimeout(() => router.push('/dashboard/teacher/assessments'), 2000)
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('Failed to upload file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-10 max-w-6xl mx-auto min-h-screen bg-slate-50/30">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Bulk CSV Import</h1>
            <p className="text-slate-500 text-lg font-medium">
              Quickly populate your question bank using standardized CSV templates.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl font-bold border-slate-200">
             <Table className="w-4 h-4 mr-2" /> Download Template
          </Button>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 space-y-6">
            <AdvancedCSVUploader mode="quiz" targetId={assessmentId || ''} />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-white p-10">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-600" /> CSV Schema Guide
              </h3>
              <div className="space-y-8">
                <div className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-100 before:rounded-full">
                  <p className="font-black text-slate-900 mb-1">questionText <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded ml-2">REQUIRED</span></p>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">The primary text or prompt for the question. Supports Markdown.</p>
                </div>
                <div className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-100 before:rounded-full">
                  <p className="font-black text-slate-900 mb-1">questionType <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded ml-2 text-purple-600">ENUM</span></p>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">MCQ_SINGLE, MCQ_MULTIPLE, FITB, TRUE_FALSE, or SHORT_ANSWER.</p>
                </div>
                <div className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-100 before:rounded-full">
                  <p className="font-black text-slate-900 mb-1">options <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded ml-2 text-blue-600">JSON</span></p>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">For MCQ: ["Option A", "Option B", "Option C", "Option D"]</p>
                </div>
                <div className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-100 before:rounded-full">
                  <p className="font-black text-slate-900 mb-1">correctAnswer</p>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">The letter (A-D) for MCQ or text for Fill-in-the-gap.</p>
                </div>
              </div>
            </Card>

            <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
               <h4 className="font-black text-lg mb-2">Need a sample?</h4>
               <p className="text-slate-400 text-sm font-medium mb-6">Start with our pre-configured CSV structure to ensure 100% import success.</p>
               <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black rounded-xl">
                 View Examples
               </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
