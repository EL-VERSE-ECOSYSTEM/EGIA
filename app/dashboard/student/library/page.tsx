'use client'

import React, { useState, useMemo } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Search, BookOpen, FileText, Video,
  Download, Star, HelpCircle, Eye,
  BookMarked, Sparkles, X, ChevronLeft,
  ChevronRight, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react'

// Realistic comprehensive academic resource library dataset for EL GOODNEWS INT'L ACADEMY
const LIBRARY_RESOURCES = [
  // TEXTBOOKS
  {
    id: 'res-1',
    title: 'Essential Mathematics for Senior Secondary Schools (Book 1)',
    category: 'Textbooks',
    subject: 'Mathematics',
    classLevel: 'SSS 1',
    author: 'Dr. O. A. Adebayo',
    pages: 412,
    downloads: 128,
    fileSize: '14.2 MB',
    isPremium: false,
    content: `Chapter 1: Number Bases. Let's learn conversion between bases, addition, and subtraction in other bases. Binary, octal, and hexadecimal operations...`
  },
  {
    id: 'res-2',
    title: 'Modern Biology for Senior Secondary Schools',
    category: 'Textbooks',
    subject: 'Biology',
    classLevel: 'SSS 2',
    author: 'Prof. T. U. Ndu',
    pages: 385,
    downloads: 95,
    fileSize: '18.5 MB',
    isPremium: false,
    content: `Chapter 3: Photosynthesis. Photosynthesis is the chemical process by which green plants build up complex organic substances from carbon dioxide and water using light energy...`
  },
  {
    id: 'res-3',
    title: 'New School Physics for SSS',
    category: 'Textbooks',
    subject: 'Physics',
    classLevel: 'SSS 3',
    author: 'M. W. Anyakoha',
    pages: 520,
    downloads: 242,
    fileSize: '22.1 MB',
    isPremium: false,
    content: `Chapter 12: Waves and Wave Motion. Reflection, refraction, diffraction, and polarization of wave pulses. Formulas for frequency, wavelength, and velocity...`
  },
  {
    id: 'res-4',
    title: 'Interactive English Grammar & Composition',
    category: 'Textbooks',
    subject: 'English Language',
    classLevel: 'JSS 2',
    author: 'Sarah I. Williams',
    pages: 210,
    downloads: 74,
    fileSize: '8.4 MB',
    isPremium: false,
    content: `Unit 4: Pronouns and Conjunctions. Learn subjective, objective, possessive, and relative pronouns with classroom examples...`
  },

  // PAST QUESTIONS
  {
    id: 'res-5',
    title: 'WAEC Mathematics Past Questions & Solutions (2020 - 2025)',
    category: 'Past Questions',
    subject: 'Mathematics',
    classLevel: 'SSS 3',
    author: 'EGIA Academic Committee',
    pages: 88,
    downloads: 512,
    fileSize: '4.8 MB',
    isPremium: false,
    content: `WAEC 2024 Theory Section A. Question 1: Simplify 3(x-2)/4 - (2x-1)/3 = 5. Solution details inside...`
  },
  {
    id: 'res-6',
    title: 'NECO Civic Education Past Exam Papers',
    category: 'Past Questions',
    subject: 'Civic Education',
    classLevel: 'SSS 3',
    author: 'EGIA Academic Committee',
    pages: 45,
    downloads: 189,
    fileSize: '3.1 MB',
    isPremium: false,
    content: `Section A: National Values, Citizenship, human rights, and constitutional structures in Nigeria...`
  },
  {
    id: 'res-7',
    title: 'Junior WAEC (BECE) Basic Science Solved Papers',
    category: 'Past Questions',
    subject: 'Biology',
    classLevel: 'JSS 3',
    author: 'EGIA Prep Board',
    pages: 64,
    downloads: 305,
    fileSize: '5.2 MB',
    isPremium: false,
    content: `BECE 2023. Basic science components including simple machines, light transmission, and skeletal systems...`
  },

  // CLASS NOTES
  {
    id: 'res-8',
    title: 'Grade 5 Arithmetic Operations & Word Problems Notes',
    category: 'Class Notes',
    subject: 'Mathematics',
    classLevel: 'Primary 5',
    author: 'Mrs. Blessing Obi',
    pages: 18,
    downloads: 42,
    fileSize: '1.2 MB',
    isPremium: false,
    content: `Week 2 Notes: Long Division and Prime Factorization. Always find the smallest prime factor first, then divide continuously...`
  },
  {
    id: 'res-9',
    title: 'SSS 2 Chemistry: Complete Organic Chemistry Revision Notes',
    category: 'Class Notes',
    subject: 'Chemistry',
    classLevel: 'SSS 2',
    author: 'Mr. Emmanuel Okafor',
    pages: 35,
    downloads: 167,
    fileSize: '2.8 MB',
    isPremium: false,
    content: `Introduction to Alkanes, Alkenes, Alkynes. Saturated vs. unsaturated hydrocarbons, IUPAC nomenclature rules, and laboratory preparation methods...`
  },

  // VIDEO TUTORIALS
  {
    id: 'res-10',
    title: 'Video Lecture: Quadratic Equations Made Super Easy',
    category: 'Video Tutorials',
    subject: 'Mathematics',
    classLevel: 'SSS 1',
    author: 'Mr. Charles Udoh',
    pages: 1, // Simulated video length: 15 mins
    downloads: 98,
    fileSize: '45.0 MB',
    isPremium: false,
    content: `[Simulated Video Playback] This 15-minute video lecture explains factoring, completing the square, and using the quadratic formula: x = (-b ± √(b² - 4ac)) / 2a.`
  },
  {
    id: 'res-11',
    title: 'Computer Science: Introduction to Python Programming',
    category: 'Video Tutorials',
    subject: 'Computer Studies',
    classLevel: 'SSS 2',
    author: 'Dr. Jane Peters',
    pages: 1, // Video
    downloads: 140,
    fileSize: '65.2 MB',
    isPremium: false,
    content: `[Simulated Video Playback] Master variables, loop structures, conditionals, and standard input/output syntax in Python.`
  },

  // STUDY GUIDES
  {
    id: 'res-12',
    title: 'Primary 4 Elementary Science Discovery Guide',
    category: 'Study Guides',
    subject: 'Biology',
    classLevel: 'Primary 4',
    author: 'Mrs. Sandra Alabi',
    pages: 28,
    downloads: 36,
    fileSize: '3.4 MB',
    isPremium: false,
    content: `Discovery Guide. Unit 1: Living and Non-Living things. Interactive field assignments: observing backyard insects and naming plant leaves...`
  }
]

// Sample Homework Helper AI Knowledgebase responses for realistic interaction
const AI_HOMEWORK_KNOWLEDGEBASE: Record<string, { subject: string, bookRef: string, answer: string }> = {
  'photosynthesis': {
    subject: 'Biology',
    bookRef: 'Modern Biology (SSS 2), Page 45',
    answer: 'Photosynthesis is the metabolic process by which green plants, algae, and some bacteria convert light energy (usually from the Sun) into chemical energy (glucose) using water (H2O) and carbon dioxide (CO2). The byproduct is oxygen (O2). Chemical equation: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.'
  },
  'quadratic formula': {
    subject: 'Mathematics',
    bookRef: 'Essential Mathematics (SSS 1), Page 112',
    answer: 'The quadratic formula is used to find the roots/solutions of any quadratic equation of the form ax² + bx + c = 0. The formula is: x = (-b ± √(b² - 4ac)) / 2a. The term (b² - 4ac) is called the discriminant, which determines the nature of the roots.'
  },
  'binary conversions': {
    subject: 'Mathematics',
    bookRef: 'Essential Mathematics (SSS 1), Page 8',
    answer: 'To convert a base 10 (decimal) number to base 2 (binary), divide the decimal number by 2 repeatedly and record the remainders from bottom to top. For example, 13 in base 10 converts to 1101 in base 2.'
  },
  'organic chemistry': {
    subject: 'Chemistry',
    bookRef: 'Complete Organic Chemistry (SSS 2), Page 14',
    answer: 'Organic Chemistry is the branch of chemistry that deals with carbon compounds (except carbonates, bicarbonates, and oxides). Main families include Hydrocarbons (Alkanes, Alkenes, Alkynes) and Functional groups (Alcohols, Carboxylic acids, Esters).'
  },
  'waves': {
    subject: 'Physics',
    bookRef: 'New School Physics (SSS 3), Page 150',
    answer: 'A wave is a disturbance that travels through a medium, transferring energy from one point to another without causing permanent displacement of the particles of the medium. Waves are classified into Mechanical (require medium, e.g. sound) and Electromagnetic (do not require medium, e.g. light).'
  }
}

export default function StudentLibraryPage() {
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

  // Homework Helper AI Assistant
  const [homeworkInput, setHomeworkInput] = useState('')
  const [aiResponse, setAiResponse] = useState<any | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Unique lists for filtering
  const categories = ['All', 'Textbooks', 'Past Questions', 'Class Notes', 'Video Tutorials', 'Study Guides']
  const subjects = ['All', 'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology', 'Civic Education', 'Computer Studies']
  const grades = [
    'All',
    'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JSS 1', 'JSS 2', 'JSS 3',
    'SSS 1', 'SSS 2', 'SSS 3'
  ]

  // Dynamic state loaded directly from SQL Database using searchLibraryBooks
  const [resources, setResources] = useState<any[]>([])
  const [dbLoading, setDbLoading] = useState(true)

  React.useEffect(() => {
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

  const handleDownload = (res: typeof LIBRARY_RESOURCES[0]) => {
    // Simulated increment
    setDownloadCounters(prev => ({
      ...prev,
      [res.id]: (prev[res.id] || res.downloads) + 1
    }))
    alert(`📥 Starting secure download of "${res.title}" (${res.fileSize}). Please check your local files.`)
  }

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!homeworkInput.trim()) return

    setAiLoading(true)
    setAiResponse(null)

    setTimeout(() => {
      const text = homeworkInput.toLowerCase()
      // Look up in simple keyword dictionary
      let matchedKey: string | null = null
      for (const key of Object.keys(AI_HOMEWORK_KNOWLEDGEBASE)) {
        if (text.includes(key)) {
          matchedKey = key
          break
        }
      }

      if (matchedKey) {
        setAiResponse(AI_HOMEWORK_KNOWLEDGEBASE[matchedKey])
      } else {
        setAiResponse({
          subject: 'General Study',
          bookRef: 'Curriculum Framework',
          answer: `I analyzed your question: "${homeworkInput}". While I don't have a direct extract for this specific phrase, try searching the general library catalogue using key words (like Biology, Waves, or Arithmetic) to find the correct study notes or past papers!`
        })
      }
      setAiLoading(false)
    }, 800)
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-[1600px] mx-auto space-y-12 min-h-screen bg-slate-50/20">

        {/* Modern Interactive Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BookMarked size={350} strokeWidth={1} />
          </div>
          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-orange-400 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-orange-400" /> EL GOODNEWS ACADEMY DIGITAL LIBRARY
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Your Academic Excellence Starts Here.
            </h1>
            <p className="text-slate-300 text-base md:text-lg font-medium leading-relaxed">
              Access curriculum-approved textbooks, detailed class lecture notes, official solved WAEC/NECO/BECE past questions, and educational videos for homework assignments or exams.
            </p>
          </div>
        </div>

        {/* Grid: Search & Catalog vs. Homework Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* CATALOGUE (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Resource Catalogue</h2>
                <p className="text-slate-500 font-bold text-sm mt-1">
                  Showing {filteredResources.length} matching educational guides
                </p>
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full md:max-w-xs shrink-0">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search title, author, topic..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 text-xs focus:ring-orange-600 transition-all"
                />
              </div>
            </div>

            {/* Quick Filters Panel */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${selectedCategory === cat ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Grade</Label>
                  <select
                    value={selectedGrade}
                    onChange={e => setSelectedGrade(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-700 focus:bg-white text-xs focus:ring-orange-600 focus:outline-none transition-all"
                  >
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade === 'All' ? 'All Classes (Primary 3 - SSS 3)' : grade}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Filter</Label>
                  <select
                    value={selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-700 focus:bg-white text-xs focus:ring-orange-600 focus:outline-none transition-all"
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>{subj === 'All' ? 'All Subjects' : subj}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Resources List */}
            {dbLoading ? (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-20 text-center flex flex-col items-center justify-center">
                <div className="animate-spin text-orange-600 mb-4">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-bold text-sm">Searching EL GOODNEWS database...</p>
              </Card>
            ) : filteredResources.length === 0 ? (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white p-20 text-center">
                <div className="bg-slate-50 p-6 rounded-full w-fit mx-auto mb-6 text-slate-400 border border-slate-100">
                  <BookOpen size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-900">No Resources Found</h3>
                <p className="text-slate-500 font-medium text-sm mt-2 max-w-sm mx-auto">
                  We couldn't find any resources matching your exact keyword filters. Try clearing your search query or selecting a different category.
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All')
                    setSelectedGrade('All')
                    setSelectedSubject('All')
                  }}
                  className="mt-6 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-xs"
                >
                  Reset All Filters
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                {filteredResources.map(res => {
                  const isFav = favorites.includes(res.id)
                  const count = downloadCounters[res.id] || res.downloads
                  const isVideo = res.category === 'Video Tutorials'

                  return (
                    <Card key={res.id} className="border-none shadow-xl shadow-slate-200/30 rounded-[2rem] bg-white overflow-hidden flex flex-col justify-between group hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
                      <div>
                        {/* Resource header banner */}
                        <div className="p-6 pb-0 flex items-start justify-between">
                          <div className="flex gap-2">
                            <Badge className="bg-orange-100 text-orange-800 border-none font-black text-[9px] uppercase tracking-wider rounded-md">
                              {res.category}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800 border-none font-black text-[9px] uppercase tracking-wider rounded-md">
                              {res.subject}
                            </Badge>
                          </div>

                          <button
                            onClick={() => toggleFavorite(res.id)}
                            className="p-2.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-all shrink-0"
                            title={isFav ? 'Remove Favorite' : 'Save Resource'}
                          >
                            <Star className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                        </div>

                        <CardHeader className="p-6">
                          <CardTitle className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                            {res.title}
                          </CardTitle>
                          <CardDescription className="text-xs font-bold text-slate-400 mt-2">
                            By {res.author} • Recommended for <span className="text-slate-800">{res.classLevel}</span>
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
                          {isVideo ? 'VIDEO' : `${res.pages} Pages`} • {res.fileSize}
                        </span>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCurrentPage(1)
                              setActivePreview(res)
                            }}
                            className="rounded-xl border-slate-200 hover:border-orange-600 hover:text-orange-600 font-bold text-xs h-9 px-3 gap-1.5"
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
          </div>

          {/* HOMEWORK AI ASSISTANT (Right 1 Column) */}
          <div className="space-y-8">
            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-gradient-to-b from-orange-600 to-amber-600 text-white p-8 overflow-hidden relative sticky top-28">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
                <Sparkles size={180} />
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <Badge className="bg-white/20 text-white font-black text-[9px] border-none uppercase tracking-widest px-3 py-1 mb-4">
                     POWERED BY SCHOOL AI
                  </Badge>
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    Homework Help Desk
                  </h3>
                  <p className="text-orange-100 text-xs font-semibold leading-relaxed mt-2">
                    Stuck on an assignment or complex science formula? Ask our customized homework helper to retrieve explanations and page references!
                  </p>
                </div>

                <form onSubmit={handleAiSearch} className="space-y-3">
                  <div className="relative">
                    <HelpCircle className="absolute left-4 top-3.5 h-5 w-5 text-orange-200" />
                    <Input
                      type="text"
                      placeholder="e.g. photosynthesis, waves, quadratic formula..."
                      value={homeworkInput}
                      onChange={e => setHomeworkInput(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-none bg-white/15 text-white placeholder-orange-200/70 font-semibold text-xs focus:ring-white transition-all focus:bg-white/20"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={aiLoading}
                    className="w-full h-11 bg-white text-orange-700 hover:bg-orange-50 rounded-xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg"
                  >
                    {aiLoading ? 'Retrieving Book Info...' : 'Retrieve Answers'}
                  </Button>
                </form>

                {/* AI Response Display Area */}
                {aiResponse && (
                  <div className="p-5 bg-white text-slate-800 rounded-3xl border border-orange-200 animate-in zoom-in-95 duration-300 space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-black text-[10px] text-orange-600 uppercase tracking-widest">
                        {aiResponse.subject}
                      </span>
                      <span className="font-black text-[9px] text-slate-400 uppercase tracking-wider">
                        Ref: {aiResponse.bookRef}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-bold leading-relaxed">
                      {aiResponse.answer}
                    </p>
                    <div className="pt-1.5 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          // Find corresponding resources by subject
                          setSelectedSubject(aiResponse.subject)
                          setSearchQuery('')
                        }}
                        className="text-orange-600 hover:text-orange-700 p-0 h-auto font-black text-[10px] uppercase tracking-wider"
                      >
                        Find Recommended Textbook
                      </Button>
                    </div>
                  </div>
                )}

                {/* Tips/Suggestions */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <p className="text-[10px] font-black text-orange-200 uppercase tracking-widest">Suggested Keywords:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['photosynthesis', 'waves', 'quadratic formula', 'binary conversions'].map(kw => (
                      <button
                        key={kw}
                        onClick={() => {
                          setHomeworkInput(kw)
                        }}
                        className="text-[9px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>

        {/* FULLSCREEN MOCK READ ONLINE / DOCUMENT PREVIEW MODAL */}
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <Card className="max-w-5xl w-full h-[90vh] border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between">

              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0">
                    {activePreview.category === 'Video Tutorials' ? <Video size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {activePreview.title}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      Resource Preview Simulator • {activePreview.author}
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

              {/* PDF Viewer Page Body */}
              <div className="flex-1 bg-slate-800 p-8 overflow-y-auto flex items-center justify-center relative">

                {activePreview.category === 'Video Tutorials' ? (
                  <div className="w-full max-w-2xl aspect-video bg-black rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col items-center justify-center text-center p-8 space-y-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-amber-600/10" />
                    <div className="w-20 h-20 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform cursor-pointer relative z-10">
                      <Play className="w-8 h-8 fill-white ml-1 text-white" />
                    </div>
                    <div className="relative z-10 space-y-2">
                      <p className="text-sm font-black text-white uppercase tracking-widest">EL GOODNEWS ACADEMY SCREEN PLAYER</p>
                      <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                        Simulating media playback streaming. Complete lecture notes of chemistry, biology, or physics are pre-indexed to facilitate high speed learning.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                    className="w-full max-w-2xl min-h-[60vh] bg-white rounded-2xl shadow-2xl p-12 transition-all duration-300 relative select-none border border-slate-100 flex flex-col justify-between"
                  >
                    {/* Page Content */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          EL GOODNEWS ACADEMY LIBRARY
                        </span>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                          Page {currentPage} of {activePreview.pages}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xl font-black text-slate-900 leading-tight">
                          {activePreview.title}
                        </h4>
                        <div className="h-[2px] bg-orange-100 w-16" />

                        {currentPage === 1 ? (
                          <div className="space-y-4 pt-4">
                            <p className="text-sm font-black text-slate-800 uppercase tracking-widest text-orange-600">Chapter / Document Extract Preview</p>
                            <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100/50">
                              {activePreview.content}
                            </p>
                            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
                              This document extract represents the active lesson material approved by EL GOODNEWS ACADEMY. Use the direct download options on the catalog card to obtain full offline documents.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4 pt-4 text-center py-10">
                            <LockIcon className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-sm font-black text-slate-800">Review Copy Limit Reached</p>
                            <p className="text-slate-400 text-xs font-semibold max-w-sm mx-auto">
                              To read all remaining {activePreview.pages - 1} pages offline, please download the resource directly using the download button.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Page Footer */}
                    <div className="border-t border-slate-100 pt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      © EL GOODNEWS INT'L ACADEMY • PREVIEW REVISION LICENSE
                    </div>
                  </div>
                )}

              </div>

              {/* Preview Navigation & Zoom Controls Footer */}
              <div className="p-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
                {/* Left: Zoom Controls */}
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
                    title="Reset Zoom"
                  >
                    <RotateCcw size={14} />
                  </Button>
                </div>

                {/* Center: Page Selection */}
                {activePreview.category !== 'Video Tutorials' && (
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="rounded-xl font-bold h-10 px-4 gap-1.5"
                    >
                      <ChevronLeft size={16} /> Previous
                    </Button>
                    <span className="text-xs font-black text-slate-800">
                      Page {currentPage} of {activePreview.pages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === activePreview.pages}
                      onClick={() => setCurrentPage(prev => Math.min(activePreview.pages, prev + 1))}
                      className="rounded-xl font-bold h-10 px-4 gap-1.5"
                    >
                      Next <ChevronRight size={16} />
                    </Button>
                  </div>
                )}

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      handleDownload(activePreview)
                      setActivePreview(null)
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs h-10 px-5 gap-2 shadow-md"
                  >
                    <Download size={14} /> DOWNLOAD DOCUMENT
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

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  )
}

function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
      />
    </svg>
  )
}
