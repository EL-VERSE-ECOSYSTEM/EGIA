'use client'

import React, { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {
  getAllUsersForSuperAdmin,
  awardStudentGiftAction
} from '@/app/actions/super-admin'
import { Gift, RefreshCw, Search, Award, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'

export default function StudentGiftingPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [giftTitle, setGiftTitle] = useState('Academic Excellence Award')
  const [giftReason, setGiftReason] = useState('Top performance in CBT assessment.')
  const [giftAmount, setGiftAmount] = useState('5000')
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const res = await getAllUsersForSuperAdmin()
    if (res.success) {
      setStudents((res.users || []).filter((u: any) => u.role === 'STUDENT' || u.role === 'PUPIL'))
    } else {
      toast.error('Failed to load student directory')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtimeSubscription('student_gifts', () => {
    toast.info('Student gifts updated in real time')
  })

  const handleAwardGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !giftTitle || !giftAmount) {
      toast.error('Please select a student and fill in title and amount.')
      return
    }

    setSubmitting(true)
    const res = await awardStudentGiftAction({
      studentId: selectedStudent.id,
      title: giftTitle,
      reason: giftReason,
      amount: Number(giftAmount),
      giftType: 'CASH'
    })

    if (res.success) {
      toast.success(`Awarded ${giftAmount} NGN gift credit to ${selectedStudent.name}!`)
      setSelectedStudent(null)
    } else {
      toast.error('error' in res ? res.error : 'Failed to award gift.')
    }
    setSubmitting(false)
  }

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardLayout role="super-admin">
      <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black uppercase mb-2">
              <Gift className="w-3.5 h-3.5" /> Rewards & Recognition
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Gifting & Academic Awards Desk</h1>
            <p className="text-slate-500 text-sm font-semibold mt-1">
              Award cash grants, fee credits, and monetary prizes to high-performing students across any school.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" /> Award Student Gift
            </h2>

            {selectedStudent ? (
              <form onSubmit={handleAwardGift} className="space-y-4 text-xs font-bold">
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <p className="text-amber-900 font-black">{selectedStudent.name}</p>
                  <p className="text-amber-700 text-[10px]">{selectedStudent.email}</p>
                </div>

                <div>
                  <label className="block uppercase text-slate-500 mb-1">Award Title</label>
                  <input
                    type="text"
                    value={giftTitle}
                    onChange={e => setGiftTitle(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-500 mb-1">Grant Amount (NGN)</label>
                  <input
                    type="number"
                    value={giftAmount}
                    onChange={e => setGiftAmount(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase text-slate-500 mb-1">Reason / Citation</label>
                  <textarea
                    rows={3}
                    value={giftReason}
                    onChange={e => setGiftReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl uppercase text-xs shadow-md transition"
                  >
                    {submitting ? 'Granting...' : 'Disburse Award'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Select a student from the directory on the right to award cash prizes or academic fee credits.
              </p>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-sm"
              />
            </div>

            {loading ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
                <p className="text-xs font-bold text-slate-500">Loading student directory...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
                <Gift className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-black text-slate-900">No Students Found</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {filtered.map(s => (
                    <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                      <div>
                        <p className="text-xs font-black text-slate-900">{s.name}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{s.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase transition shadow-sm"
                      >
                        Select For Gift
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
