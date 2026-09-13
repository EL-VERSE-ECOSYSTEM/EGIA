'use client'

import React, { useState, useMemo } from 'react'
import {
  Upload, FileSpreadsheet, Eye, Play, BookOpen, Layers,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Search,
  Download, Moon, Sun, RotateCw, Bookmark, Sparkles, Sliders
} from 'lucide-react'

interface AdvancedCSVUploaderProps {
  mode?: 'quiz' | 'books' | 'flashcards' | 'content' | 'general' | 'lesson-notes'
  onDataLoaded?: (data: any) => void
  targetId?: string
}

export function AdvancedCSVUploader({
  mode = 'general',
  onDataLoaded,
  targetId = '',
}: AdvancedCSVUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [csvResult, setCsvResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'interactive'>('preview')

  // Pagination for large CSV tables
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Field Mapping state
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Interactive Quiz state
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [quizScore, setQuizScore] = useState(0)
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  // Interactive Library Reader state
  const [selectedBook, setSelectedBook] = useState<any | null>(null)
  const [nightMode, setNightMode] = useState(false)
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookBookmarks, setBookmarks] = useState<Record<string, boolean>>({})

  // Flashcards state
  const [flashcardIndex, setFlashcardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [learnedCards, setLearnedCards] = useState<Record<number, boolean>>({})

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = async (f: File) => {
    setFile(f)
    setLoading(true)

    const formData = new FormData()
    formData.append('file', f)
    formData.append('type', mode)
    formData.append('targetId', targetId)
    formData.append('mapping', JSON.stringify(mapping))

    try {
      const res = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        alert(data.error || 'Failed to parse CSV file.')
      } else {
        setCsvResult(data)
        if (onDataLoaded) onDataLoaded(data)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to upload and parse CSV file.')
    } finally {
      setLoading(false)
    }
  }

  const paginatedRows = useMemo(() => {
    if (!csvResult?.rows) return []
    const start = (currentPage - 1) * pageSize
    return csvResult.rows.slice(start, start + pageSize)
  }, [csvResult, currentPage])

  const totalPages = Math.ceil((csvResult?.totalRows || 0) / pageSize)

  // Export JSON or CSV
  const handleExportJSON = () => {
    if (!csvResult) return
    const blob = new Blob([JSON.stringify(csvResult.rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exported_csv_data_${Date.now()}.json`
    a.click()
  }

  return (
    <div className="w-full space-y-6">
      {/* DRAG & DROP CSV FILE UPLOADER */}
      {!csvResult ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-emerald-500/40 bg-slate-900/60 rounded-3xl p-8 sm:p-12 text-center hover:border-emerald-400 transition-colors cursor-pointer space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-base font-bold text-white">
              Drag & Drop your CSV file here, or <span className="text-emerald-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports UTF-8 multi-line rows, auto column mapping, and large datasets (10,000+ rows)
            </p>
          </div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csvFileInput"
          />
          <label
            htmlFor="csvFileInput"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Upload className="w-4 h-4" />
            {loading ? 'Processing CSV...' : 'Select CSV File'}
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TOP BAR / METRICS & TABS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm font-black text-white">{file?.name || 'Uploaded CSV Data'}</p>
                <p className="text-xs text-slate-400">
                  {csvResult.totalRows} Rows • {csvResult.headers.length} Columns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'preview'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5 inline mr-1" /> Data Preview
              </button>
              <button
                onClick={() => setActiveTab('interactive')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'interactive'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Play className="w-3.5 h-3.5 inline mr-1" /> Interactive View
              </button>
              <button
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5 inline mr-1" /> Export
              </button>
              <button
                onClick={() => { setCsvResult(null); setFile(null); }}
                className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition"
              >
                Reset
              </button>
            </div>
          </div>

          {/* TAB 1: PREVIEW TABLE & PAGINATION */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                    <tr>
                      {csvResult.headers.map((h: string) => (
                        <th key={h} className="px-4 py-3">
                          {h}{' '}
                          <span className="text-emerald-500 lowercase font-normal">
                            ({csvResult.detectedTypes[h] || 'text'})
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {paginatedRows.map((row: any, rIdx: number) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                        {csvResult.headers.map((h: string) => (
                          <td key={h} className="px-4 py-3 max-w-xs truncate">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-2">
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 transition"
                    >
                      <ChevronLeft className="w-4 h-4 inline" /> Prev
                    </button>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 hover:bg-slate-700 transition"
                    >
                      Next <ChevronRight className="w-4 h-4 inline" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE CONTENT VIEWER */}
          {activeTab === 'interactive' && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
              {/* QUIZ MODE */}
              {(mode === 'quiz' || csvResult.headers.some((h: string) => h.toLowerCase().includes('question'))) && (
                <div className="max-w-2xl mx-auto space-y-6">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span>Question {quizIndex + 1} of {csvResult.rows.length}</span>
                    <span className="text-emerald-400 font-black">Score: {quizScore}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${((quizIndex + 1) / csvResult.rows.length) * 100}%` }}
                    />
                  </div>

                  <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                    <h3 className="text-lg font-black text-white">
                      {csvResult.rows[quizIndex]?.Question || csvResult.rows[quizIndex]?.question || csvResult.rows[quizIndex]?.[csvResult.headers[0]]}
                    </h3>

                    <div className="space-y-2">
                      {['Option A', 'Option B', 'Option C', 'Option D', 'option a', 'option b', 'option c', 'option d']
                        .filter(optKey => csvResult.rows[quizIndex]?.[optKey])
                        .map(optKey => {
                          const val = csvResult.rows[quizIndex][optKey]
                          const isSelected = selectedAnswer === val
                          return (
                            <button
                              key={optKey}
                              onClick={() => setSelectedAnswer(val)}
                              className={`w-full p-3.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                                isSelected
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <span>{val}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </button>
                          )
                        })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      disabled={quizIndex === 0}
                      onClick={() => { setQuizIndex(prev => prev - 1); setSelectedAnswer(null); }}
                      className="px-4 py-2 rounded-xl bg-slate-800 disabled:opacity-40 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      Previous
                    </button>
                    <button
                      disabled={!selectedAnswer}
                      onClick={() => {
                        const correctVal = csvResult.rows[quizIndex]?.Correct || csvResult.rows[quizIndex]?.correct
                        if (selectedAnswer === correctVal) setQuizScore(s => s + 1)
                        if (quizIndex < csvResult.rows.length - 1) {
                          setQuizIndex(prev => prev + 1)
                          setSelectedAnswer(null)
                        } else {
                          setQuizSubmitted(true)
                        }
                      }}
                      className="px-6 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black hover:bg-emerald-400"
                    >
                      {quizIndex < csvResult.rows.length - 1 ? 'Next Question' : 'Submit Quiz'}
                    </button>
                  </div>
                </div>
              )}

              {/* LIBRARY CATALOG / BOOK READER MODE */}
              {(mode === 'books' || csvResult.headers.some((h: string) => h.toLowerCase().includes('title'))) && (
                <div className="space-y-6">
                  {selectedBook ? (
                    <div className={`p-6 sm:p-10 rounded-3xl space-y-6 transition-colors ${nightMode ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-900'}`}>
                      <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                        <button
                          onClick={() => setSelectedBook(null)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                        >
                          ← Back to Catalog
                        </button>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setNightMode(!nightMode)} className="p-2 rounded-lg bg-slate-100 text-slate-800">
                            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-2xl font-black">{selectedBook.Title || selectedBook.title}</h2>
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                          By {selectedBook.Author || selectedBook.author} • {selectedBook.Genre || selectedBook.category || 'General'}
                        </p>
                      </div>

                      <div className={`prose max-w-none font-serif leading-relaxed ${fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-lg' : 'text-sm'}`}>
                        {selectedBook['Content/Description'] || selectedBook.Description || selectedBook.content || 'Full content text preview.'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search books by title, author, or genre..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {csvResult.rows
                          .filter((b: any) =>
                            (b.Title || b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (b.Author || b.author || '').toLowerCase().includes(searchQuery.toLowerCase())
                          )
                          .map((book: any, idx: number) => (
                            <div key={idx} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                              <div className="space-y-2">
                                <h4 className="font-black text-white text-base leading-snug">{book.Title || book.title || 'Untitled'}</h4>
                                <p className="text-xs text-slate-400 font-bold">By {book.Author || book.author || 'Unknown'}</p>
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                  {book.Genre || book.category || 'General'}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedBook(book)}
                                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
                              >
                                Read Book Details
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
