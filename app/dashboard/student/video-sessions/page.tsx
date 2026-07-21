'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Video, Play, MessageSquare, Send,
  Search, Sparkles, User, Calendar, BookOpen, Clock
} from 'lucide-react'

interface LectureVideo {
  id: string
  title: string
  subject: string
  classLevel: string
  teacherName: string
  duration: string
  videoUrl: string
  description: string
  questions: Array<{
    id: string
    studentName: string
    questionText: string
    askedAt: string
    replies: Array<{
      id: string
      repliedBy: string
      replyText: string
      repliedAt: string
    }>
  }>
}

const INITIAL_VIDEO_SESSIONS: LectureVideo[] = [
  {
    id: 'vid-1',
    title: 'Algebraic Equations & Factoring Methods',
    subject: 'Mathematics',
    classLevel: 'JSS 3',
    teacherName: 'Mr. Charles Udoh',
    duration: '45 mins',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    description: 'A comprehensive walkthrough on factorization, grouping terms, and solving quadratic algebra formulas.',
    questions: [
      {
        id: 'q-1',
        studentName: 'Joy Onoha',
        questionText: 'Sir, how do we group terms when the signs are mixed (positives and negatives)?',
        askedAt: '2 hours ago',
        replies: [
          {
            id: 'r-1',
            repliedBy: 'Mr. Charles Udoh (Teacher)',
            replyText: 'Excellent question, Joy! Always factor out the negative sign first so that the signs inside the bracket match the first group.',
            repliedAt: '1 hour ago'
          }
        ]
      }
    ]
  },
  {
    id: 'vid-2',
    title: 'Introduction to Wave Motion & Frequency Spectrum',
    subject: 'Physics',
    classLevel: 'SSS 3',
    teacherName: 'M. W. Anyakoha',
    duration: '50 mins',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    description: 'Learn the principles of mechanical wave pulses, reflection indices, and period calculations.',
    questions: []
  },
  {
    id: 'vid-3',
    title: 'Photosynthesis Cycle & Chlorophyll Synthesis',
    subject: 'Biology',
    classLevel: 'SSS 2',
    teacherName: 'Prof. T. U. Ndu',
    duration: '40 mins',
    videoUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    description: 'Detailed analysis of light-dependent vs light-independent stages in plants.',
    questions: [
      {
        id: 'q-2',
        studentName: 'Chidi Doe',
        questionText: 'What is the role of NADPH in the Calvin Cycle?',
        askedAt: '1 day ago',
        replies: []
      }
    ]
  }
]

export default function StudentVideoSessionsPage() {
  const [sessions, setSessions] = useState<LectureVideo[]>(INITIAL_VIDEO_SESSIONS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSession, setSelectedVideo] = useState<LectureVideo>(INITIAL_VIDEO_SESSIONS[0])
  const [newQuestion, setNewQuestion] = useState('')

  // Load custom uploads from localStorage if any exist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('teacher_uploaded_videos')
      if (stored) {
        try {
          const parsed: LectureVideo[] = JSON.parse(stored)
          // Merge with initial sessions, avoiding duplicates
          const merged = [...INITIAL_VIDEO_SESSIONS]
          parsed.forEach(p => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p)
            }
          })
          setSessions(merged)
          // Default to the first custom one if available
          if (parsed.length > 0) {
            setSelectedVideo(merged[merged.length - 1])
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  // Sync questions with active video selection
  const activeVideo = sessions.find(v => v.id === selectedSession.id) || selectedSession

  const filteredSessions = sessions.filter(vid =>
    vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vid.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vid.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestion.trim()) return

    const updatedQuestion = {
      id: `q-${Date.now()}`,
      studentName: 'Student User (Me)',
      questionText: newQuestion.trim(),
      askedAt: 'Just now',
      replies: []
    }

    const updatedSessions = sessions.map(vid => {
      if (vid.id === activeVideo.id) {
        return {
          ...vid,
          questions: [updatedQuestion, ...vid.questions]
        }
      }
      return vid
    })

    setSessions(updatedSessions)
    // Save state back to localStorage for persistence across the demo app
    localStorage.setItem('teacher_uploaded_videos', JSON.stringify(updatedSessions))
    setNewQuestion('')
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-[1600px] mx-auto space-y-10 min-h-screen bg-slate-50/20">

        {/* Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-10 text-white shadow-xl">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <Badge className="bg-white/10 text-indigo-300 font-bold uppercase tracking-widest px-3 py-1 mb-2">
              Virtual Video Classrooms
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
              Stream Pre-recorded Lectures & Video Classes
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium">
              Watch recorded classroom sessions compiled by your subject teachers, participate in the active lecture discussion, and ask questions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

          {/* Left/Center Column: Selected Video & Q&A (2/3 Width) */}
          <div className="xl:col-span-2 space-y-8">

            {/* Simulated High-Fidelity Video Player */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-950 overflow-hidden text-white relative">
              <div className="aspect-video bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                {/* Visual Video Playback Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-black" />
                <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform cursor-pointer relative z-10 animate-pulse">
                  <Play className="w-10 h-10 fill-white ml-1 text-white" />
                </div>

                <div className="absolute bottom-6 left-8 right-6 z-10 flex items-center justify-between">
                  <div>
                    <Badge className="bg-indigo-600 text-white border-none font-bold uppercase tracking-wider text-[9px] mb-2 px-2.5 py-1">
                      {activeVideo.subject} • {activeVideo.classLevel}
                    </Badge>
                    <h2 className="text-xl md:text-2xl font-black text-white">{activeVideo.title}</h2>
                    <p className="text-xs text-slate-400 font-bold mt-1">Instructor: {activeVideo.teacherName} • {activeVideo.duration}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Video Lecture Metadata Description */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white p-8">
              <h3 className="text-lg font-black text-slate-900">Lecture Overview</h3>
              <p className="text-slate-500 font-medium text-sm mt-3 leading-relaxed">
                {activeVideo.description}
              </p>
            </Card>

            {/* HIGH FIDELITY QUESTION & ANSWERS FEEDBACK DESK */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Classroom Q&A Discussion</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    Ask questions directly on this video lecture
                  </p>
                </div>
                <Badge className="bg-slate-100 text-slate-600 border-none font-black text-xs px-3.5 py-1">
                  {activeVideo.questions.length} Questions
                </Badge>
              </div>

              {/* Ask Question Form */}
              <form onSubmit={handleAskQuestion} className="flex gap-3">
                <Input
                  placeholder="Type your question about this class..."
                  value={newQuestion}
                  onChange={e => setNewQuestion(e.target.value)}
                  className="h-12 rounded-xl border-slate-200 font-medium text-xs focus:ring-indigo-600"
                />
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl font-bold gap-2">
                  <Send size={14} /> Send
                </Button>
              </form>

              {/* Questions Stream */}
              <div className="space-y-6 pt-2">
                {activeVideo.questions.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs text-slate-500 font-bold">No questions asked on this video yet.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Be the first to participate in the classroom discussion!</p>
                  </div>
                ) : (
                  activeVideo.questions.map(q => (
                    <div key={q.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                          {q.studentName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{q.studentName}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{q.askedAt}</p>
                        </div>
                      </div>

                      <p className="text-xs font-bold text-slate-700 pl-1 leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Replies stream */}
                      {q.replies.map(r => (
                        <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100/80 ml-6 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-[9px]">
                              T
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-emerald-800">{r.repliedBy}</p>
                              <p className="text-[8px] text-slate-400 font-bold">{r.repliedAt}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium pl-1 leading-relaxed">
                            {r.replyText}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </Card>

          </div>

          {/* Right Column: Video Catalog Sidebar List (1/3 Width) */}
          <div className="space-y-6">

            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search lectures, topics, teachers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 text-xs focus:ring-indigo-600 transition-all"
              />
            </div>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white p-6 space-y-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase tracking-wider ml-1">Lectures Library</h3>

              <div className="space-y-3.5">
                {filteredSessions.map(vid => {
                  const isSelected = vid.id === activeVideo.id
                  return (
                    <div
                      key={vid.id}
                      onClick={() => {
                        setSelectedVideo(vid)
                        setNewQuestion('')
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <Play size={20} className={isSelected ? 'fill-white' : ''} />
                      </div>
                      <div className="overflow-hidden space-y-1">
                        <p className="font-black text-xs text-slate-900 truncate leading-tight">{vid.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{vid.subject} • {vid.classLevel}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                          <User size={12} /> {vid.teacherName}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredSessions.length === 0 && (
                  <p className="text-xs text-slate-400 font-bold text-center py-6">No matching lectures found.</p>
                )}
              </div>
            </Card>

            {/* General Info and Guidance info box */}
            <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 space-y-4">
               <h4 className="font-black text-indigo-950 flex items-center gap-2 text-sm">
                 <Sparkles className="text-indigo-600 w-4 h-4" /> Virtual Lecture Guidelines
               </h4>
               <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                 All lectures are hosted directly on our secured high-speed media network. If you have any difficulty streaming or loading video slides, please contact your class teacher.
               </p>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
