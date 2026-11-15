import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { wrapReportCardPdfText } from '@/lib/report-cards/pdf-layout'

describe('Report-card PDF text layout', () => {
  it('wraps long score breakdowns without dropping text', async () => {
    const document = await PDFDocument.create()
    const font = await document.embedFont(StandardFonts.Helvetica)
    const breakdown = Array.from({ length: 60 }, (_, index) => `Section ${index + 1} ${index}/100`).join(' | ')

    const lines = wrapReportCardPdfText(breakdown, font, 7, 180)

    assert.ok(lines.length > 1)
    assert.equal(lines.join(' '), breakdown)
    assert.ok(lines.every((line) => font.widthOfTextAtSize(line, 7) <= 180))
  })

  it('splits unbroken text to stay within the page width', async () => {
    const document = await PDFDocument.create()
    const font = await document.embedFont(StandardFonts.Helvetica)
    const token = 'W'.repeat(180)

    const lines = wrapReportCardPdfText(token, font, 9, 100)

    assert.ok(lines.length > 1)
    assert.equal(lines.join(''), token)
    assert.ok(lines.every((line) => font.widthOfTextAtSize(line, 9) <= 100))
  })
})
