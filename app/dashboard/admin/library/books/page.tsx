'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'
import { AdvancedCSVUploader } from '@/components/csv/AdvancedCSVUploader'
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  ChevronRight,
  ShieldCheck,
  Loader2
} from 'lucide-react'

interface ImportPreview {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  insertable: number;
  preview: any[];
}

export default function LibraryBooksAdminPage() {
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'import' | 'history'>('import')
  const [updateExisting, setUpdateExisting] = useState(true)
  const [skipDuplicates, setSkipDuplicates] = useState(false)

  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [previewData, setPreviewData] = useState<ImportPreview | null>(null)
  const [errors, setErrors] = useState<any[]>([])
  const [results, setResults] = useState<ImportPreview | null>(null)

  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/library/books/import')
      const data = await res.json()
      if (data.success) {
        setHistory(data.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    }
  }, [activeTab])

  // Real-time Supabase Database Sync for Library Books and Import Logs
  useRealtimeSubscription('library_books', () => {
    if (activeTab === 'history') loadHistory()
    toast('Library catalog updated in real time')
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Load preview automatically
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mode', 'preview')

      try {
        const res = await fetch('/api/library/books/import', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        if (data.success) {
          setPreviewData(data.summary)
          setErrors(data.errors || [])
        } else {
          alert(data.error || 'Preview failed')
        }
      } catch (err) {
        alert('Failed to connect to backend import API')
      }
    }
  }

  const handleExecuteImport = async () => {
    if (!file) return
    setImporting(true)
    setProgress(15)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('mode', 'import')
    formData.append('updateExisting', String(updateExisting))
    formData.append('skipDuplicates', String(skipDuplicates))

    try {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 150)

      const res = await fetch('/api/library/books/import', {
        method: 'POST',
        body: formData
      })

      clearInterval(interval)
      setProgress(100)

      const data = await res.json()
      if (data.success) {
        setResults(data.summary)
        setPreviewData(null)
        setFile(null)
        alert('Books imported successfully to library!')
      } else {
        alert(data.error || 'Import failed')
      }
    } catch (err) {
      alert('Network error executing book import')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'isbn',
      'title',
      'authors',
      'subtitle',
      'publisher',
      'publication_year',
      'edition',
      'volume',
      'language',
      'pages',
      'category',
      'sub_category',
      'description',
      'total_copies',
      'physical_location',
      'class_level',
      'keywords',
      'is_digital'
    ]

    const sampleRow = [
      '97810482',
      'Mathematics for Senior Secondary Schools (Book 1)',
      'Dr. O. A. Adebayo',
      'Number Bases and Algebra',
      'University Press',
      '2022',
      '1st Edition',
      '1',
      'English',
      '280',
      'Mathematics',
      'Textbooks',
      'Comprehensive textbook covering number base conversions...',
      '10',
      'Main Block Shelf A1',
      'SSS1',
      'mathematics, algebra, base systems',
      'false'
    ]

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), sampleRow.join(',')].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "library_books_import_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Library Catalog Control</h1>
          <p className="text-slate-500 text-lg font-medium">Bulk import educational resource assets via CSV and analyze library collections.</p>
        </div>

        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('import')}
            className={`py-4 px-8 font-black text-sm uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'import' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Import Books
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-8 font-black text-sm uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'history' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Import History Log
          </button>
        </div>

        {activeTab === 'import' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <AdvancedCSVUploader mode="books" />
            </div>

            {/* Side summary panel */}
            <div className="space-y-8">
              {results && (
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-emerald-50/50 border border-emerald-100 p-8 space-y-6">
                  <div className="flex items-center gap-3 text-emerald-800">
                    <CheckCircle className="w-8 h-8" />
                    <div>
                      <h3 className="font-black text-xl">Import Complete</h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mt-0.5">Success report</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-slate-900">{results.inserted}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Inserted</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-slate-900">{results.updated}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Updated</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-slate-900">{results.skipped}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Skipped</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 text-center">
                      <p className="text-2xl font-black text-slate-900">{results.failed}</p>
                      <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Failed</p>
                    </div>
                  </div>
                </Card>
              )}

              {errors.length > 0 && (
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-red-50/50 border border-red-100 p-8 space-y-4">
                  <div className="flex items-center gap-3 text-red-800">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <h3 className="font-black text-lg">Line-by-Line Correction Log</h3>
                  </div>
                  <div className="max-h-[300px] overflow-auto space-y-3 pr-2">
                    {errors.map((err, idx) => (
                      <div key={idx} className="p-4 bg-white border border-red-100 rounded-xl text-xs space-y-1">
                        <p className="font-black text-red-950">Line {err.line}</p>
                        <p className="text-slate-500 font-semibold">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="text-2xl font-black">Historical Bulk Upload Ledger</CardTitle>
              <CardDescription className="font-bold">Analyze previous CSV imports</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="p-24 text-center">
                  <RefreshCw className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-4" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing catalog logs...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-24 text-center text-slate-400 italic font-bold">No import history found.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Date</TableHead>
                      <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Filename</TableHead>
                      <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Total Records</TableHead>
                      <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-green-600">Inserted</TableHead>
                      <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-indigo-600">Updated</TableHead>
                      <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-red-600">Failed</TableHead>
                      <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-50">
                    {history.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="p-6 text-slate-500 font-bold text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="p-6 font-black text-slate-900 text-sm">
                          {log.filename}
                        </TableCell>
                        <TableCell className="p-6 font-mono text-sm">{log.total_records}</TableCell>
                        <TableCell className="p-6 font-mono text-sm font-black text-green-600">+{log.inserted}</TableCell>
                        <TableCell className="p-6 font-mono text-sm font-black text-indigo-600">~{log.updated}</TableCell>
                        <TableCell className="p-6 font-mono text-sm font-black text-red-600">-{log.failed}</TableCell>
                        <TableCell className="p-6 text-right">
                          <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] px-2.5 py-1">
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
