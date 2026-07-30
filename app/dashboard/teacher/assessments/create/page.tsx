'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit,
  Eye,
  Save,
  Send,
  FileSpreadsheet,
  Zap,
  Layout
} from 'lucide-react'

export default function CreateAssessmentPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('upload')
  const [conversionProgress, setConversionProgress] = useState(0)
  const [isConverting, setIsConverting] = useState(false)

  const handleUpload = () => {
    setIsConverting(true)
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setConversionProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
        setIsConverting(false)
        router.push('/dashboard/teacher/assessments/create/pdf')
      }
    }, 200)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create New Assessment</h1>
        <p className="text-slate-500 font-medium">Add assessments for Weekend Assignments, Assessments, and CBT Exams.</p>
      </div>

      <div className="p-4 mb-8 bg-amber-50 border border-amber-100 rounded-2xl text-xs font-semibold text-slate-700">
        ⚠️ CRITICAL REGULATORY RULE: Assessments, Weekend Assignments, and CBT Exams can ONLY be created using the official CSV Import template (which must contain the answers) or by typing out each question and answer manually.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="border-none shadow-xl rounded-[2rem] bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => router.push('/dashboard/teacher/assessments/create/csv')}>
          <CardHeader className="p-8 pb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
              <FileSpreadsheet className="text-emerald-600 w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-black text-slate-900">CSV Template Import</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-1 leading-relaxed text-xs">
              Upload questions along with their options and correct answers in our standard CSV format.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-none shadow-xl rounded-[2rem] bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onClick={() => router.push('/dashboard/teacher/assessments/create/text')}>
          <CardHeader className="p-8 pb-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <Edit className="text-orange-600 w-7 h-7" />
            </div>
            <CardTitle className="text-xl font-black text-slate-900">Manual Entry / Typing</CardTitle>
            <CardDescription className="text-slate-500 font-medium mt-1 leading-relaxed text-xs">
              Type out your questions and correct answers manually using our high-fidelity rich editor.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
