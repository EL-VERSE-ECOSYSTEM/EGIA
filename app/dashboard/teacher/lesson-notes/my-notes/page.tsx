'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LessonNoteUploader } from '@/components/library/LessonNoteUploader'
import { searchLibraryBooks } from '@/app/actions/library'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { toast } from 'sonner'
import { BookOpen, FileText, Plus, Search, RefreshCw, FileCheck, Layers, Eye, Download } from 'lucide-react'

export default function TeacherLessonNotesPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'view'>('upload')
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadNotes = async () => {
    setLoading(true)
    try {
      const data = await searchLibraryBooks('')
      const filteredNotes = data.filter(item =>
        item.category?.toLowerCase().includes('note') || item.category === 'Class Notes' || item.category === 'Lesson Notes'
      )
      setNotes(filteredNotes.length > 0 ? filteredNotes : data)
    } catch (err) {
      console.error('Error fetching teacher lesson notes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [])

  // Real-time Supabase Database Sync
  useRealtimeSubscription('library_books', () => {
    loadNotes()
    toast('Lesson notes updated in real time!')
  })

  const filteredNotesList = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.classLevel.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Teacher Lesson Notes</h1>
            <p className="text-teal-700 font-bold text-sm">Upload, publish, and manage class lesson notes in real time across the library.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setActiveTab(activeTab === 'upload' ? 'view' : 'upload')}
              className="bg-[#0D9488] hover:bg-teal-700 text-white rounded-2xl h-12 px-6 font-black shadow-lg shadow-teal-100 flex items-center gap-2"
            >
              {activeTab === 'upload' ? <BookOpen className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {activeTab === 'upload' ? 'VIEW ALL NOTES' : 'UPLOAD NEW NOTE'}
            </Button>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 px-8 font-black text-sm uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'upload' ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Upload Lesson Note (PDF / Typing / CSV)
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`py-4 px-8 font-black text-sm uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'view' ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Library Lesson Notes Catalogue ({notes.length})
          </button>
        </div>

        {activeTab === 'upload' ? (
          <LessonNoteUploader
            userRole="Teacher"
            defaultAuthor="Class Subject Teacher"
            onSuccess={() => {
              loadNotes()
              setActiveTab('view')
            }}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <Search className="w-5 h-5 text-slate-400 ml-2" />
              <input
                type="text"
                placeholder="Search notes by title, subject, or class level..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent font-bold text-slate-800 text-sm focus:outline-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={loadNotes}
                className="text-slate-400 hover:text-teal-700"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="p-24 text-center">
                <RefreshCw className="w-10 h-10 animate-spin text-[#0D9488] mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing real-time lesson notes...</p>
              </div>
            ) : filteredNotesList.length === 0 ? (
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-16 text-center space-y-4">
                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-xl font-black text-slate-800">No matching lesson notes found</h3>
                <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
                  Try adjusting your search keywords or upload a new lesson note to the digital library catalogue.
                </p>
                <Button
                  onClick={() => setActiveTab('upload')}
                  className="bg-[#0D9488] text-white font-black rounded-xl px-6 py-2.5 text-xs shadow-md"
                >
                  Create First Note
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotesList.map((note) => (
                  <Card key={note.id} className="border-none shadow-xl rounded-[2.5rem] bg-white hover:shadow-2xl transition-all duration-300 p-6 flex flex-col justify-between border border-slate-100">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <Badge className="bg-teal-50 text-[#0D9488] border border-teal-200 font-black text-[10px] px-3 py-1 uppercase rounded-lg">
                          {note.subject}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-[10px] px-2.5 py-1 rounded-lg">
                          {note.classLevel}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-lg font-black text-slate-900 leading-snug line-clamp-2">
                          {note.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          By {note.author}
                        </p>
                      </div>

                      <p className="text-xs text-slate-600 font-medium line-clamp-4 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                        {note.content}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {note.fileSize || 'Digital Note'}
                      </span>
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs px-4 h-9 gap-1.5"
                        onClick={() => {
                          if (note.fileUrl) {
                            window.open(note.fileUrl, '_blank')
                          } else {
                            alert(`Note Content:\n\nTitle: ${note.title}\n\n${note.content}`)
                          }
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" /> Read
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
