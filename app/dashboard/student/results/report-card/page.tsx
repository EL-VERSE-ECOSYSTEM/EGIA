'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, Calendar, Award, Printer, Download } from 'lucide-react'
import { getReportCards, ReportCard } from '@/app/actions/report-cards'

export default function StudentReportCardPage() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getReportCards().then(cards => {
      // Find endorsed report cards for student
      const endorsed = cards.filter(c => c.status === 'ENDORSED')
      setReportCards(endorsed)
      setLoading(false)
    })
  }, [])

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-4xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Official Report Cards</h1>
            <p className="text-slate-500 text-lg font-medium">Official verified academic reports endorsed by Academy Admin.</p>
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-6 font-bold flex items-center gap-2">
            <Printer size={16} /> Print Reports
          </button>
        </div>

        <div className="space-y-8">
          {loading ? (
            <div className="text-slate-400 font-bold py-10 text-center">Loading verified reports...</div>
          ) : reportCards.length === 0 ? (
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-12 text-center">
              <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900 mb-2">No Endorsed Report Cards Yet</h3>
              <p className="text-slate-500 font-medium">Once a teacher compiles your report card and the Administrator endorses it, it will appear here immediately.</p>
            </Card>
          ) : (
            reportCards.map((c) => (
              <Card key={c.id} className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden relative">
                {/* School official banner */}
                <div className="h-4 bg-orange-600 w-full" />
                <CardContent className="p-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8 mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-xs font-black uppercase text-orange-600 tracking-wider">
                        <Award className="w-4 h-4" /> Official Academic Transcript
                      </div>
                      <h2 className="text-3xl font-black text-slate-900">{c.studentName}</h2>
                      <p className="text-slate-500 font-bold mt-1">Class: {c.className} • 2026/2027 Academic Session</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-xs uppercase px-4 py-1.5 flex items-center gap-1.5 shadow-lg shadow-emerald-100">
                        <ShieldCheck className="w-4 h-4" /> VERIFIED & ENDORSED
                      </Badge>
                      <p className="text-xs text-slate-400 font-bold">Endorsed Date: {c.endorsedAt ? new Date(c.endorsedAt).toLocaleDateString() : ''}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="font-black text-sm uppercase text-slate-400 tracking-wider">Academic Grade sheet</h3>
                    <div className="overflow-hidden border border-slate-100 rounded-3xl">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                            <th className="p-5">Subject</th>
                            <th className="p-5 text-center">Continuous Assessment (30)</th>
                            <th className="p-5 text-center">Exam (70)</th>
                            <th className="p-5 text-center">Total (100)</th>
                            <th className="p-5 text-center">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-bold text-slate-800 text-sm">
                          {c.marks.map((m, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-5 font-black text-slate-900">{m.subject}</td>
                              <td className="p-5 text-center text-slate-500">{m.testScore}</td>
                              <td className="p-5 text-center text-slate-500">{m.examScore}</td>
                              <td className="p-5 text-center font-black text-slate-950">{m.total}</td>
                              <td className="p-5 text-center">
                                <Badge className="bg-slate-900 text-white font-black rounded-lg min-w-8 justify-center">{m.grade}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-10 pt-8 border-t border-slate-100">
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Class Teacher Remarks</p>
                      <p className="text-slate-700 italic font-semibold text-sm leading-relaxed">"{c.teacherRemarks}"</p>
                    </div>

                    <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 relative overflow-hidden">
                      <p className="text-xs font-black uppercase text-orange-600 tracking-wider mb-2">Academy Administration Stamp</p>
                      <p className="text-slate-800 font-bold text-sm leading-relaxed mb-4">
                        {c.adminFeedback || 'Endorsed and approved by Academy Administration.'}
                      </p>
                      {/* Decorative Digital Stamp/Seal */}
                      <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full border-4 border-orange-500/20 flex items-center justify-center rotate-12">
                        <span className="text-[10px] font-black text-orange-500/30 uppercase tracking-widest">EGIA SEAL</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
