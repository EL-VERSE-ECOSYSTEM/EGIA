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
        <h1 className="text-3xl font-bold text-purple-900">Create New Assessment</h1>
        <p className="text-slate-500">Choose your preferred method to build a CBT exam</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:border-purple-500 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/teacher/assessments/create/pdf')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
              <FileText className="text-purple-600" />
            </div>
            <CardTitle>PDF to CBT</CardTitle>
            <CardDescription>Upload an exam paper and let AI extract questions automatically.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:border-emerald-500 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/teacher/assessments/create/csv')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-2">
              <FileSpreadsheet className="text-emerald-600" />
            </div>
            <CardTitle>CSV Import</CardTitle>
            <CardDescription>Import questions from a structured Excel or CSV file.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:border-orange-500 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/teacher/assessments/create/ai')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
              <Zap className="text-orange-600" />
            </div>
            <CardTitle>AI Generator</CardTitle>
            <CardDescription>Generate fresh questions based on a topic or curriculum.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Manual Setup</CardTitle>
          <CardDescription>Start from a blank template or existing drafts.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/teacher/assessments/create/text')}>
            <Edit className="w-4 h-4 mr-2" /> Manual Entry
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/teacher/assessments/create/template')}>
            <Layout className="w-4 h-4 mr-2" /> Use Template
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
