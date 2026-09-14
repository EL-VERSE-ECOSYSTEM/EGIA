'use client'

import React, { useState } from 'react'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { Download, Loader2 } from 'lucide-react'

interface PayslipData {
  schoolName: string
  teacherName: string
  staffCode: string
  month: string
  grossSalary: number
  deductions: Array<{ type: string; amount: number; reason?: string }>
  netSalary: number
}

export function PayslipDownloadButton({ data }: { data: PayslipData }) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = async () => {
    setGenerating(true)
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595.28, 841.89]) // A4
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      const { width, height } = page.getSize()

      // Header
      page.drawRectangle({
        x: 0,
        y: height - 100,
        width: width,
        height: 100,
        color: rgb(0.12, 0.23, 0.54), // Deep Navy
      })

      page.drawText(data.schoolName.toUpperCase(), {
        x: 40,
        y: height - 45,
        size: 18,
        font: boldFont,
        color: rgb(1, 1, 1),
      })

      page.drawText('OFFICIAL SALARY PAYSLIP', {
        x: 40,
        y: height - 70,
        size: 12,
        font: font,
        color: rgb(0.8, 0.9, 1),
      })

      // Employee Info Box
      let y = height - 140
      page.drawText(`Staff Name: ${data.teacherName}`, { x: 40, y, size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1) })
      page.drawText(`Staff Code: ${data.staffCode}`, { x: 350, y, size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1) })

      y -= 20
      page.drawText(`Pay Period: ${data.month}`, { x: 40, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) })
      page.drawText(`Date Issued: ${new Date().toLocaleDateString()}`, { x: 350, y, size: 11, font, color: rgb(0.3, 0.3, 0.3) })

      // Line
      y -= 20
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      })

      // Earnings & Deductions
      y -= 30
      page.drawText('Gross Base Salary:', { x: 40, y, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.1) })
      page.drawText(`NGN ${data.grossSalary.toLocaleString()}`, { x: 350, y, size: 12, font: boldFont, color: rgb(0.1, 0.1, 0.1) })

      y -= 30
      page.drawText('Salary Deductions:', { x: 40, y, size: 12, font: boldFont, color: rgb(0.8, 0.2, 0.2) })

      let totalDeductions = 0
      data.deductions.forEach(d => {
        y -= 20
        totalDeductions += d.amount
        page.drawText(`- ${d.type} (${d.reason || ''})`, { x: 60, y, size: 10, font, color: rgb(0.3, 0.3, 0.3) })
        page.drawText(`NGN ${d.amount.toLocaleString()}`, { x: 350, y, size: 10, font, color: rgb(0.8, 0.2, 0.2) })
      })

      if (data.deductions.length === 0) {
        y -= 20
        page.drawText('None', { x: 60, y, size: 10, font, color: rgb(0.5, 0.5, 0.5) })
      }

      // Line
      y -= 30
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1.5,
        color: rgb(0.12, 0.23, 0.54),
      })

      y -= 35
      page.drawText('NET PAYABLE SALARY:', { x: 40, y, size: 14, font: boldFont, color: rgb(0.12, 0.23, 0.54) })
      page.drawText(`NGN ${(data.grossSalary - totalDeductions).toLocaleString()}`, { x: 350, y, size: 14, font: boldFont, color: rgb(0.12, 0.23, 0.54) })

      // Footer
      page.drawText('EL LEARNERS APP • Encrypted Institutional Payroll System', {
        x: 40,
        y: 40,
        size: 9,
        font: font,
        color: rgb(0.6, 0.6, 0.6),
      })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `Payslip_${data.staffCode}_${data.month}.pdf`
      link.click()
    } catch (err) {
      console.error('Payslip generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition disabled:opacity-50"
    >
      {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      <span>Download Payslip PDF</span>
    </button>
  )
}
