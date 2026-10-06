'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Video, MessageSquare, Send, Sparkles, Play } from 'lucide-react'
import { OnlinePrepModal } from '@/components/online-prep/OnlinePrepModal'
import { ClassCommentsSection } from '@/components/comments/ClassCommentsSection'

export default function OnlinePrepLessonsPage() {
  const [selectedVideo, setSelectedVideo] = useState({
    id: 'prep-lesson-1',
    title: 'Mathematics: WAEC/JAMB Calculus & Trigonometry Intensive',
    subject: 'Mathematics',
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  })

  return (
    <DashboardLayout role="student">
      <OnlinePrepModal />
      <div className="p-8 max-w-6xl mx-auto space-y-8 min-h-screen">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> ONLINE VIDEO CLASSES
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exam Prep Video Sessions</h1>
          <p className="text-slate-500 font-medium text-xs mt-1">
            Live video classes and interactive discussions with real-time comments.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-950 text-white overflow-hidden">
              <div className="aspect-video bg-black flex items-center justify-center relative">
                <iframe
                  src={selectedVideo.url}
                  title={selectedVideo.title}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-black">{selectedVideo.title}</CardTitle>
                <CardDescription className="text-xs text-slate-400 font-bold">{selectedVideo.subject}</CardDescription>
              </CardHeader>
            </Card>

            {/* Real-time Comments Section */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-6">
              <ClassCommentsSection
                resourceType="STUDY_VIDEO"
                resourceId={selectedVideo.id}
                title="Real-time Class Comments & Questions"
              />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-6 space-y-4">
              <h3 className="font-black text-slate-900 text-sm">Recommended Video Sessions</h3>
              <div className="space-y-3">
                <div
                  onClick={() => setSelectedVideo({
                    id: 'prep-lesson-1',
                    title: 'Mathematics: WAEC/JAMB Calculus & Trigonometry Intensive',
                    subject: 'Mathematics',
                    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  })}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-300 cursor-pointer transition space-y-1"
                >
                  <p className="font-bold text-slate-800 text-xs leading-snug">Calculus & Trigonometry Intensive</p>
                  <p className="text-[10px] font-bold text-orange-600 uppercase">Mathematics</p>
                </div>

                <div
                  onClick={() => setSelectedVideo({
                    id: 'prep-lesson-2',
                    title: 'Physics: Electricity & Magnetism Problem Solving',
                    subject: 'Physics',
                    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  })}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-300 cursor-pointer transition space-y-1"
                >
                  <p className="font-bold text-slate-800 text-xs leading-snug">Electricity & Magnetism Problem Solving</p>
                  <p className="text-[10px] font-bold text-orange-600 uppercase">Physics</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
