'use client'

import React, { useState, useMemo, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Search, BookOpen, Star, Eye, Download, Sparkles, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Video
} from 'lucide-react'

export default function AvailableLibraryBooksPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedGrade, setSelectedGrade] = useState('All')

  // Stateful interactions
  const [favorites, setFavorites] = useState<string[]>([])
  const [downloadCounters, setDownloadCounters] = useState<Record<string, number>>({})
  const [activePreview, setActivePreview] = useState<any | null>(null)

  // PDF Viewer simulator controls
  const [zoom, setZoom] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)

  // Unique lists for filtering
  const categories = ['All', 'Textbooks', 'Past Questions', 'Class Notes', 'Video Tutorials', 'Study Guides']
  const [subjects, setSubjects] = useState<string[]>(['All'])
  const grades = [
    'All',
    'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1', 'SSS 2', 'SSS 3'
  ]

  // Dynamic state loaded directly from SQL Database using searchLibraryBooks
  const [resources, setResources] = useState<any[]>([])
  const [dbLoading, setDbLoading] = useState(true)

  // Subject options are shared with Session Registration and read from Supabase.
  useEffect(() => {
    async function loadSubjects() {
      try {
        const { getLibrarySubjects } = await import('@/app/actions/library')
        const rows = await getLibrarySubjects()
        setSubjects(['All', ...rows.map(item => item.name)])
      } catch (err) {
        console.error('Failed to load library subjects from server database:', err)
      }
    }
    loadSubjects()
  }, [])

  useEffect(() => {
    async function loadBooks() {
      setDbLoading(true)
      try {
        const { searchLibraryBooks } = await import('@/app/actions/library')
        const results = await searchLibraryBooks(searchQuery)
        setResources(results)
      } catch (err) {
        console.error('Failed to load library books from server database:', err)
      } finally {
        setDbLoading(false)
      }
    }
    const timer = setTimeout(() => {
      loadBooks()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const matchesCategory = selectedCategory === 'All' || res.category === selectedCategory
      const matchesSubject = selectedSubject === 'All' || res.subject === selectedSubject

      let matchesGrade = true
      if (selectedGrade !== 'All') {
        matchesGrade = res.classLevel === selectedGrade
      }

      return matchesCategory && matchesSubject && matchesGrade
    })
  }, [resources, selectedCategory, selectedSubject, selectedGrade])

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(fav => fav !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  const handleDownload = (res: any) => {
    setDownloadCounters(prev => ({
      ...prev,
      [res.id]: (prev[res.id] || res.downloads || 85) + 1
    }))
    alert(`📥 Starting secure download of parent-approved material: "${res.title}" (${res.fileSize || '12.4 MB'}).`)
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-[1600px] mx-auto space-y-12 min-h-screen bg-slate-50/20">

        {/* Parent Library Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BookOpen size={350} strokeWidth={1} />
          </div>
          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-emerald-400 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-emerald-400" /> PARENT DIGITAL RESOURCE LIBRARY
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Foster Your Child's Success.
            </h1>
            <p className="text-emerald-200 text-base md:text-lg font-medium leading-relaxed">
              Explore official textbook extracts, past questions, and solved test papers. Monitor resources recommended for your child's class levels and save materials offline.
            </p>
          </div>
        </div>

        {/* Search & Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Available Learning Resources</h2>
            <p className="text-slate-500 font-bold text-sm mt-1">
              Showing {filteredResources.length} approved academic publications
            </p>
          </div>

          <div className="relative w-full md:max-w-xs shrink-0">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by title, subject, grade..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 text-xs focus:ring-emerald-600 transition-all"
            />
          </div>
        </div>

        {/* Quick Filters Panel */}
        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Filter</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Target Grade</Label>
              <select
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-700 focus:bg-white text-xs focus:ring-emerald-600 focus:outline-none transition-all"
              >
                {grades.map(grade => (
                  <option key={grade} value={grade}>{grade === 'All' ? 'All Classes (Primary 3 - SSS 3)' : grade}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Category</Label>
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-700 focus:bg-white text-xs focus:ring-emerald-600 focus:outline-none transition-all"
              >
                {subjects.map(subj => (
                  <option key={subj} value={subj}>{subj === 'All' ? 'All Subjects' : subj}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Catalog Grid */}
        {dbLoading ? (
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-20 text-center flex flex-col items-center justify-center">
            <div className="animate-spin text-emerald-600 mb-4">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-slate-500 font-bold text-sm">Searching EL LEARN App library repository...</p>
          </Card>
        ) : filteredResources.length === 0 ? (
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-20 text-center">
            <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto mb-6 text-slate-400 border border-slate-100">
              <BookOpen size={48} />
            </div>
            <h3 className="text-xl font-black text-slate-900">No matching library books</h3>
            <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm mx-auto">
              Please try adjusting your search terms or selecting a different subject/grade category.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map(res => {
              const isFav = favorites.includes(res.id)
              const count = downloadCounters[res.id] || res.downloads || 85
              const isVideo = res.category === 'Video Tutorials'

              return (
                <Card key={res.id} className="border-none shadow-xl shadow-slate-200/30 rounded-[2rem] bg-white overflow-hidden flex flex-col justify-between group hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
                  <div>
                    <div className="p-6 pb-0 flex items-start justify-between">
                      <div className="flex gap-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[9px] uppercase tracking-wider rounded-md">
                          {res.category}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 border-none font-black text-[9px] uppercase tracking-wider rounded-md">
                          {res.subject}
                        </Badge>
                      </div>

                      <button
                        onClick={() => toggleFavorite(res.id)}
                        className="p-2.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-all shrink-0"
                      >
                        <Star className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>
                    </div>

                    <CardHeader className="p-6">
                      <CardTitle className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {res.title}
                      </CardTitle>
                      <CardDescription className="text-xs font-bold text-slate-400 mt-2">
                        By {res.author} • Class Level: <span className="text-slate-800">{res.classLevel}</span>
                      </CardDescription>
                    </CardHeader>
                  </div>

                  <CardContent className="px-6 py-0">
                    <p className="text-xs text-slate-500 font-medium line-clamp-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed italic">
                      "{res.content}"
                    </p>
                  </CardContent>

                  <CardFooter className="p-6 flex items-center justify-between mt-4 border-t border-slate-50/50 bg-slate-50/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                      {isVideo ? 'VIDEO' : `${res.pages || 210} Pages`} • {res.fileSize || '12.4 MB'}
                    </span>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentPage(1)
                          setActivePreview(res)
                        }}
                        className="rounded-xl border-slate-200 hover:border-emerald-600 hover:text-emerald-600 font-bold text-xs h-9 px-3 gap-1.5"
                      >
                        <Eye size={14} /> Preview
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleDownload(res)}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs h-9 px-3 gap-1.5 shadow-md"
                      >
                        <Download size={14} /> {count}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}

        {/* Document Preview Modal */}
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <Card className="max-w-5xl w-full h-[90vh] border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between">

              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                    {activePreview.category === 'Video Tutorials' ? <Video size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {activePreview.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      Resource Preview • {activePreview.author}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActivePreview(null)}
                  className="p-2.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Simulated PDF container */}
              <div className="flex-1 bg-slate-800 p-8 overflow-y-auto flex items-center justify-center relative">
                <div
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                  className="w-full max-w-2xl min-h-[60vh] bg-white rounded-2xl shadow-2xl p-12 transition-all duration-300 relative select-none border border-slate-100 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        EL LEARN App LIBRARY
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                        Page {currentPage} of {activePreview.pages || 210}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xl font-black text-slate-900 leading-tight">
                        {activePreview.title}
                      </h4>
                      <div className="h-[2px] bg-emerald-100 w-16" />

                      <div className="space-y-4 pt-4">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-widest text-emerald-600">Document Extract Preview</p>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100/50">
                          {activePreview.content}
                        </p>
                        <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                          Approved by the EL LEARN App Curriculum Committee. Parents can safely store or print this segment for tutoring support.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    © EL LEARN App • PARENT PREVIEW LICENSE
                  </div>
                </div>
              </div>

              {/* Modal controls */}
              <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="h-10 w-10 p-0 rounded-xl"
                  >
                    <ZoomOut size={16} />
                  </Button>
                  <span className="text-xs font-black text-slate-600 min-w-[50px] text-center">{zoom}%</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom(Math.min(150, zoom + 10))}
                    className="h-10 w-10 p-0 rounded-xl"
                  >
                    <ZoomIn size={16} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setZoom(100)}
                    className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-slate-600"
                  >
                    <RotateCcw size={14} />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      handleDownload(activePreview)
                      setActivePreview(null)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs h-10 px-5 gap-2 shadow-md"
                  >
                    <Download size={14} /> DOWNLOAD FULL FILE
                  </Button>
                </div>
              </div>

            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
