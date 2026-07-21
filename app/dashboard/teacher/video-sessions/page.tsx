'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Video, Plus, MessageSquare, Send,
  Sparkles, CheckCircle2, User, Play, Clock, BookOpen
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
  }
]

export default function TeacherVideoSessionsPage() {
  const [sessions, setSessions] = useState<LectureVideo[]>(INITIAL_VIDEO_SESSIONS)
  const [activeSession, setActiveSession] = useState<LectureVideo>(INITIAL_VIDEO_SESSIONS[0])
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})

  // Form State
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [classLevel, setClassLevel] = useState('JSS 3')
  const [duration, setDuration] = useState('45 mins')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  // Load custom uploads from localStorage if any exist
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('teacher_uploaded_videos')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          const merged = [...INITIAL_VIDEO_SESSIONS]
          parsed.forEach((p: LectureVideo) => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p)
            }
          })
          setSessions(merged)
          if (parsed.length > 0) {
            setActiveSession(merged[merged.length - 1])
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [])

  const activeVideo = sessions.find(v => v.id === activeSession.id) || activeSession

  const handleUploadVideo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      return alert('Please fill in all details')
    }

    const newVideo: LectureVideo = {
      id: `vid-${Date.now()}`,
      title: title.trim(),
      subject,
      classLevel,
      teacherName: 'Teacher Instructor (Me)',
      duration,
      videoUrl: videoUrl.trim() || 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      description: description.trim(),
      questions: []
    }

    const updated = [newVideo, ...sessions]
    setSessions(updated)
    localStorage.setItem('teacher_uploaded_videos', JSON.stringify(updated))
    setActiveSession(newVideo)

    // Clear form
    setTitle('')
    setDescription('')
    setVideoUrl('')
    alert('SUCCESS! Pre-recorded video lecture uploaded successfully. It is now instantly active in the Students video hub.')
  }

  const handleReplyQuestion = (questionId: string) => {
    const text = replyInputs[questionId]
    if (!text?.trim()) return

    const newReply = {
      id: `r-${Date.now()}`,
      repliedBy: 'Teacher Instructor (Me)',
      replyText: text.trim(),
      repliedAt: 'Just now'
    }

    const updatedSessions = sessions.map(vid => {
      if (vid.id === activeVideo.id) {
        return {
          ...vid,
          questions: vid.questions.map(q => {
            if (q.id === questionId) {
              return {
                ...q,
                replies: [...q.replies, newReply]
              }
            }
            return q
          })
        }
      }
      return vid
    })

    setSessions(updatedSessions)
    localStorage.setItem('teacher_uploaded_videos', JSON.stringify(updatedSessions))

    // Clear input
    setReplyInputs(prev => ({
      ...prev,
      [questionId]: ''
    }))
  }

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-[1600px] mx-auto space-y-10 min-h-screen bg-slate-50/20">

        {/* Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950 p-10 text-white shadow-xl">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <Badge className="bg-white/10 text-purple-300 font-bold uppercase tracking-widest px-3 py-1 mb-2">
              Teacher Lecture Control Hub
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
              Publish Video Lectures & Dynamic Lessons
            </h1>
            <p className="text-slate-300 text-sm md:text-base font-medium">
              Upload class recordings, lecture notes references, and directly answer questions asked by student groups on specific video topics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

          {/* Left Column: Upload New Video Lecture Form (1/3 Width) */}
          <div className="space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Upload Pre-recorded Class</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Publish lecture material into Student digital video stream</p>
              </div>

              <form onSubmit={handleUploadVideo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vtitle" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Video Lecture Title</Label>
                  <Input
                    id="vtitle"
                    placeholder="e.g. Wave Reflexes & Interference"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Subject</Label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-700 text-xs focus:ring-purple-600 focus:outline-none focus:bg-white"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="English Language">English Language</option>
                      <option value="Computer Studies">Computer Studies</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class Level</Label>
                    <select
                      value={classLevel}
                      onChange={e => setClassLevel(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-700 text-xs focus:ring-purple-600 focus:outline-none focus:bg-white"
                    >
                      <option value="JSS 1">JSS 1</option>
                      <option value="JSS 2">JSS 2</option>
                      <option value="JSS 3">JSS 3</option>
                      <option value="SSS 1">SSS 1</option>
                      <option value="SSS 2">SSS 2</option>
                      <option value="SSS 3">SSS 3</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class Duration</Label>
                    <Input
                      placeholder="e.g. 45 mins"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Video URL / Source</Label>
                    <Input
                      placeholder="Simulated path or MP4"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      className="h-11 rounded-xl border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lecture Outline & Description</Label>
                  <textarea
                    rows={4}
                    placeholder="Provide outlines or homework assignment references..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    className="w-full p-4 rounded-xl border border-slate-200 font-bold text-xs focus:ring-purple-600 focus:outline-none focus:bg-white"
                  />
                </div>

                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-xl font-bold gap-2 text-xs uppercase tracking-widest mt-2">
                  <Plus size={14} /> Upload Video Class
                </Button>
              </form>
            </Card>
          </div>

          {/* Center/Right Column: Manage Lecture Questions & Discussion (2/3 Width) */}
          <div className="xl:col-span-2 space-y-8">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Class: {activeVideo.title}</h2>
                <p className="text-slate-500 font-bold text-xs mt-1">Viewing questions asked by student groups</p>
              </div>

              {/* Selector for uploaded videos */}
              <select
                value={activeVideo.id}
                onChange={e => {
                  const selected = sessions.find(s => s.id === e.target.value)
                  if (selected) {
                    setActiveSession(selected)
                  }
                }}
                className="h-11 px-4 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 text-xs focus:ring-purple-600 focus:outline-none"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.title} ({s.subject})</option>
                ))}
              </select>
            </div>

            {/* Questions stream */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <MessageSquare className="text-purple-600" /> Student Inquiries & Discussion
                </h3>
                <Badge className="bg-purple-100 text-purple-700 border-none font-black text-xs px-3.5 py-1">
                  {activeVideo.questions.length} Pending
                </Badge>
              </div>

              <div className="space-y-6">
                {activeVideo.questions.length === 0 ? (
                  <div className="text-center py-14 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-black text-slate-800">No student questions on this lecture yet!</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">Questions asked by students in their student portal will appear here for you to answer.</p>
                  </div>
                ) : (
                  activeVideo.questions.map(q => (
                    <div key={q.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs">
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

                      {/* Display replies */}
                      {q.replies.map(r => (
                        <div key={r.id} className="p-4 bg-white rounded-2xl border border-slate-100 ml-6 space-y-2">
                          <p className="text-[10px] font-black text-emerald-800">{r.repliedBy} • <span className="text-slate-400 font-medium text-[8px]">{r.repliedAt}</span></p>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {r.replyText}
                          </p>
                        </div>
                      ))}

                      {/* Reply form */}
                      <div className="flex gap-2.5 pt-2 ml-6">
                        <Input
                          placeholder="Write reply to student..."
                          value={replyInputs[q.id] || ''}
                          onChange={e => setReplyInputs({
                            ...replyInputs,
                            [q.id]: e.target.value
                          })}
                          className="h-10 rounded-xl border-slate-200 text-xs font-semibold focus:ring-purple-600 bg-white"
                        />
                        <Button
                          onClick={() => handleReplyQuestion(q.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 h-10 px-5 rounded-xl font-bold gap-1.5 text-xs shrink-0"
                        >
                          <Send size={12} /> Reply
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  )
}
