import type { PDFFont } from 'pdf-lib'

export function printableReportCardPdfText(value: string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '?').slice(0, 2000)
}

export function wrapReportCardPdfText(value: string, font: PDFFont, size: number, maxWidth: number) {
  const words = printableReportCardPdfText(value).trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate
      continue
    }

    if (line) lines.push(line)
    let segment = ''
    for (const character of word) {
      if (segment && font.widthOfTextAtSize(`${segment}${character}`, size) > maxWidth) {
        lines.push(segment)
        segment = character
      } else {
        segment += character
      }
    }
    line = segment
  }

  if (line) lines.push(line)
  return lines.length ? lines : ['']
}
