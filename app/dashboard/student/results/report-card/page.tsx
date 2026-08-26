'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShieldCheck, Award, Printer, Download, Filter, GraduationCap } from 'lucide-react'
import { getReportCards, ReportCard } from '@/app/actions/report-cards'

export default function StudentReportCardPage() {
  const [allReportCards, setAllReportCards] = useState<ReportCard[]>([])
  const [reportCards, setReportCards] = useState<ReportCard[]>([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [sessionFilter, setSessionFilter] = useState('ALL')
  const [termFilter, setTermFilter] = useState('ALL')
  const [classFilter, setClassFilter] = useState('ALL')

  useEffect(() => {
    getReportCards().then(cards => {
      // Find endorsed report cards
      const endorsed = cards.filter(c => c.status === 'ENDORSED')
      setAllReportCards(endorsed)
      setReportCards(endorsed)
      setLoading(false)
    })
  }, [])

  // Apply filters on the fly
  useEffect(() => {
    let filtered = [...allReportCards]
    if (sessionFilter !== 'ALL') {
      filtered = filtered.filter(c => (c.session || '2026/2027') === sessionFilter)
    }
    if (termFilter !== 'ALL') {
      filtered = filtered.filter(c => (c.term || 'First Term') === termFilter)
    }
    if (classFilter !== 'ALL') {
      filtered = filtered.filter(c => c.className === classFilter)
    }
    setReportCards(filtered)
  }, [sessionFilter, termFilter, classFilter, allReportCards])

  // Extract unique filter options from the report cards
  const sessions = Array.from(new Set(allReportCards.map(c => c.session || '2026/2027')))
  const terms = Array.from(new Set(allReportCards.map(c => c.term || 'First Term')))
  const classes = Array.from(new Set(allReportCards.map(c => c.className)))

  // Pure HTML5 Canvas rendering for high-quality PNG download
  const downloadPNG = (c: ReportCard) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1350
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Background & Borders
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Inner Border
    ctx.strokeStyle = '#0F172A'
    ctx.lineWidth = 15
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    ctx.strokeStyle = '#F97316'
    ctx.lineWidth = 3
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70)

    // Header Banner
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(38, 38, canvas.width - 76, 180)

    // Gold/Orange accent line
    ctx.fillStyle = '#F97316'
    ctx.fillRect(38, 218, canvas.width - 76, 12)

    // School Logo representation on Canvas
    ctx.fillStyle = '#EA580C' // Orange
    ctx.beginPath()
    ctx.arc(120, 128, 45, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px sans-serif'
    ctx.fillText('EG', 95, 140)

    // School details
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'black 36px sans-serif'
    ctx.fillText("EL LEARN App", 200, 115)
    ctx.font = 'bold 18px sans-serif'
    ctx.fillStyle = '#94A3B8'
    ctx.fillText('OFFICIAL ACADEMIC REPORT TRANSCRIPT', 200, 150)
    ctx.fillText('MOTTO: EXCELLENCE, INTEGRITY AND KNOWLEDGE', 200, 175)

    // Student Title Section
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText(c.studentName, 60, 290)

    ctx.fillStyle = '#64748B'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(`Class: ${c.className}`, 60, 330)
    ctx.fillText(`Session: ${c.session || '2026/2027'}`, 350, 330)
    ctx.fillText(`Term: ${c.term || 'First Term'}`, 680, 330)

    // Status Badge
    ctx.fillStyle = '#DCFCE7'
    ctx.beginPath()
    ctx.roundRect(60, 360, 260, 45, 10)
    ctx.fill()

    ctx.fillStyle = '#15803D'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('✓ VERIFIED & APPROVED', 90, 388)

    // Table Header
    const tableTop = 440
    ctx.fillStyle = '#F8FAFC'
    ctx.fillRect(60, tableTop, canvas.width - 120, 50)
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 1
    ctx.strokeRect(60, tableTop, canvas.width - 120, 50)

    ctx.fillStyle = '#475569'
    ctx.font = 'bold 16px sans-serif'
    ctx.fillText('Subject', 80, tableTop + 32)
    ctx.fillText('Test (30)', 450, tableTop + 32)
    ctx.fillText('Exam (70)', 600, tableTop + 32)
    ctx.fillText('Total (100)', 750, tableTop + 32)
    ctx.fillText('Grade', 900, tableTop + 32)

    // Table Rows
    let currentY = tableTop + 50
    c.marks.forEach((m) => {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(60, currentY, canvas.width - 120, 55)
      ctx.strokeRect(60, currentY, canvas.width - 120, 55)

      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(m.subject, 80, currentY + 34)

      ctx.fillStyle = '#475569'
      ctx.fillText(m.testScore.toString(), 450, currentY + 34)
      ctx.fillText(m.examScore.toString(), 600, currentY + 34)

      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 18px sans-serif'
      ctx.fillText(m.total.toString(), 750, currentY + 34)

      // Grade badge on Canvas
      ctx.fillStyle = '#1E293B'
      ctx.beginPath()
      ctx.roundRect(890, currentY + 12, 45, 30, 6)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText(m.grade, 905, currentY + 32)

      currentY += 55
    })

    // Remarks Section
    currentY += 40
    ctx.fillStyle = '#F8FAFC'
    ctx.fillRect(60, currentY, 410, 160)
    ctx.strokeRect(60, currentY, 410, 160)

    ctx.fillStyle = '#475569'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('CLASS TEACHER REMARKS:', 80, currentY + 35)

    ctx.fillStyle = '#0F172A'
    ctx.font = 'italic 16px sans-serif'
    // Split text into multiple lines if needed
    const remarks = c.teacherRemarks || 'Satisfactory academic progress.'
    ctx.fillText(`"${remarks}"`, 80, currentY + 75, 370)

    // Stamp / Endorsement Section
    ctx.fillStyle = '#F0FDF4'
    ctx.fillRect(530, currentY, 410, 160)
    ctx.strokeRect(530, currentY, 410, 160)

    ctx.fillStyle = '#166534'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('ACADEMY STAMP & SEAL:', 550, currentY + 35)

    ctx.fillStyle = '#14532D'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(c.adminFeedback || 'Endorsed and approved by Administration.', 550, currentY + 70, 370)

    // Digital stamp effect
    ctx.strokeStyle = 'rgba(22, 101, 52, 0.2)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(850, currentY + 110, 45, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = 'rgba(22, 101, 52, 0.3)'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('EGIA APPROVED', 815, currentY + 114)

    // Footer
    ctx.fillStyle = '#94A3B8'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText('This document is electronically generated and is verified at the Academy Registry.', 260, 1280)

    // Download PNG
    const dataURL = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `Report_Card_${c.studentName.replace(/\s+/g, '_')}_${(c.term || 'First_Term').replace(/\s+/g, '_')}.png`
    link.href = dataURL
    link.click()
  }

  // PDF Download is achieved by printing a high-resolution, perfectly-fit report card print window or saving as PDF
  const downloadPDF = (c: ReportCard) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Report Card - ${c.studentName}</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 40px;
              color: #0f172a;
              background-color: white;
            }
            .border-outer {
              border: 15px solid #0f172a;
              padding: 30px;
              border-radius: 4px;
            }
            .header {
              background-color: #0f172a;
              color: white;
              padding: 30px;
              border-bottom: 8px solid #f97316;
              display: flex;
              align-items: center;
              gap: 20px;
              margin-bottom: 30px;
            }
            .logo {
              width: 80px;
              height: 80px;
              background-color: #ea580c;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: bold;
              color: white;
            }
            .school-name {
              font-size: 28px;
              font-weight: 900;
              margin: 0;
            }
            .motto {
              font-size: 14px;
              color: #94a3b8;
              margin: 5px 0 0 0;
              font-weight: bold;
            }
            .student-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 20px;
            }
            .student-name {
              font-size: 24px;
              font-weight: bold;
              margin: 0 0 10px 0;
            }
            .meta-text {
              font-size: 16px;
              color: #64748b;
              font-weight: 600;
            }
            .badge {
              background-color: #dcfce7;
              color: #15803d;
              padding: 8px 16px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: bold;
              display: inline-block;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f8fafc;
              color: #475569;
              font-weight: bold;
              text-align: left;
              padding: 15px;
              border: 1px solid #e2e8f0;
            }
            td {
              padding: 15px;
              border: 1px solid #e2e8f0;
              font-weight: bold;
            }
            .grade-badge {
              background-color: #0f172a;
              color: white;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 14px;
            }
            .grid-footer {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-top: 40px;
            }
            .panel {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 20px;
              border-radius: 8px;
              min-height: 120px;
            }
            .panel-stamp {
              background-color: #f0fdf4;
              border-color: #bbf7d0;
            }
            .panel-title {
              font-size: 12px;
              font-weight: 900;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 10px;
            }
            .panel-stamp .panel-title {
              color: #166534;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="border-outer">
            <div class="header">
              <div class="logo">EG</div>
              <div>
                <h1 class="school-name">EL LEARN App</h1>
                <p class="motto">MOTTO: EXCELLENCE, INTEGRITY AND KNOWLEDGE • OFFICIAL TRANSCRIPT</p>
              </div>
            </div>

            <div class="student-info">
              <div>
                <h2 class="student-name">${c.studentName}</h2>
                <span class="meta-text">Class: ${c.className} &bull; Session: ${c.session || '2026/2027'} &bull; Term: ${c.term || 'First Term'}</span>
              </div>
              <div>
                <div class="badge">✓ VERIFIED & APPROVED</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th style="text-align: center;">Continuous Assessment (30)</th>
                  <th style="text-align: center;">Exam (70)</th>
                  <th style="text-align: center;">Total (100)</th>
                  <th style="text-align: center;">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${c.marks.map(m => `
                  <tr>
                    <td>${m.subject}</td>
                    <td style="text-align: center; color: #475569;">${m.testScore}</td>
                    <td style="text-align: center; color: #475569;">${m.examScore}</td>
                    <td style="text-align: center; font-weight: 900;">${m.total}</td>
                    <td style="text-align: center;"><span class="grade-badge">${m.grade}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="grid-footer">
              <div class="panel">
                <div class="panel-title">Class Teacher Remarks</div>
                <p style="font-style: italic; font-weight: 600;">"${c.teacherRemarks || 'Satisfactory academic standard.'}"</p>
              </div>
              <div class="panel panel-stamp">
                <div class="panel-title">Academy Administration Stamp</div>
                <p style="font-weight: bold; color: #14532D;">${c.adminFeedback || 'Endorsed and approved by Academy Administration.'}</p>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-5xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Academic Transcript</h1>
            <p className="text-slate-500 text-lg font-medium">Verify, filter, and download your historical official report cards.</p>
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-12 px-6 font-bold flex items-center gap-2 self-start md:self-auto">
            <Printer size={16} /> Print Reports Page
          </button>
        </div>

        {/* History Filters Section */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
              <Filter className="w-5 h-5 text-orange-600" />
              <span>Filter History:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto md:flex-1">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Session</span>
                <Select value={sessionFilter} onValueChange={(val) => setSessionFilter(val || 'ALL')}>
                  <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-11 text-xs font-black">
                    <SelectValue placeholder="All Sessions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sessions</SelectItem>
                    {sessions.map((s, idx) => (
                      <SelectItem key={idx} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Term</span>
                <Select value={termFilter} onValueChange={(val) => setTermFilter(val || 'ALL')}>
                  <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-11 text-xs font-black">
                    <SelectValue placeholder="All Terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Terms</SelectItem>
                    {terms.map((t, idx) => (
                      <SelectItem key={idx} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class</span>
                <Select value={classFilter} onValueChange={(val) => setClassFilter(val || 'ALL')}>
                  <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-11 text-xs font-black">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Classes</SelectItem>
                    {classes.map((c, idx) => (
                      <SelectItem key={idx} value={c || ''}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Report Cards List */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-slate-400 font-bold py-10 text-center">Loading verified reports...</div>
          ) : reportCards.length === 0 ? (
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-12 text-center">
              <ShieldCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900 mb-2">No Matching Report Cards</h3>
              <p className="text-slate-500 font-medium">No endorsed report cards match your selected filter criteria.</p>
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
                      <p className="text-slate-500 font-bold mt-1">Class: {c.className} • {c.term || 'First Term'} • {c.session || '2026/2027'} Session</p>
                    </div>

                    <div className="flex flex-col md:items-end gap-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => downloadPNG(c)}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl h-10 px-4 text-xs font-black flex items-center gap-1.5 transition-all"
                        >
                          <Download size={14} /> Download PNG
                        </button>
                        <button
                          onClick={() => downloadPDF(c)}
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-4 text-xs font-black flex items-center gap-1.5 transition-all"
                        >
                          <Download size={14} /> Download PDF
                        </button>
                      </div>
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
