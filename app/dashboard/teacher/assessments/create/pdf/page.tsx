import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, ArrowRight, Zap, Search, Shield } from 'lucide-react'
import Link from 'next/link'

export default function Page() {
  const role = 'teacher';
  const title = 'AI PDF to CBT Converter';

  return (
    <DashboardLayout role={role as any}>
      <div className="p-10 max-w-6xl mx-auto min-h-screen bg-slate-50/30">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">{title}</h1>
          <p className="text-slate-500 text-lg font-medium">
            Transform your PDF exam papers into interactive digital CBT assessments in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-12">
              <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-16 text-center hover:border-purple-200 hover:bg-purple-50/30 transition-all cursor-pointer group">
                <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-purple-900/5">
                  <Upload className="w-10 h-10 text-purple-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4">Click to Upload PDF</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
                  Support for mixed Multiple Choice, Fill-in-the-gap, and True/False questions.
                </p>

                <input type="file" className="hidden" id="pdf-upload" accept=".pdf" />
                <label htmlFor="pdf-upload">
                   <Button size="lg" className="bg-purple-600 hover:bg-purple-700 h-16 px-10 rounded-2xl font-black text-lg shadow-xl shadow-purple-200 transition-all hover:-translate-y-1">
                    Select Exam Paper
                  </Button>
                </label>
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
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black text-xs shrink-0">4</div>
                  <p className="text-sm text-slate-300 font-medium">Publish to the CBT portal for students to take the exam.</p>
                </div>
              </div>
            </Card>

            <div className="p-8 bg-amber-50 rounded-[2rem] border-2 border-amber-100">
               <h3 className="font-black text-amber-900 mb-4 flex items-center gap-2">
                 <Zap className="w-5 h-5 fill-amber-500 text-amber-500" /> Pro Tips
               </h3>
               <ul className="text-sm text-amber-800 space-y-3 font-medium">
                 <li className="flex gap-2">
                   <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                   Clearer PDFs yield 99% accuracy.
                 </li>
                 <li className="flex gap-2">
                   <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                   Handwritten notes are supported via DeepSeek OCR.
                 </li>
                 <li className="flex gap-2">
                   <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                   Answer keys at the end help auto-grading.
                 </li>
               </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
