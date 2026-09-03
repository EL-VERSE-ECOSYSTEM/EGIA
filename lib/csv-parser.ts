export interface CSVParseResult {
  headers: string[]
  rows: Record<string, string>[]
  totalRows: number
  detectedTypes: Record<string, 'text' | 'number' | 'date'>
}

export function parseCSV(text: string): Record<string, string>[] {
  const result = parseCSVAdvanced(text)
  return result.rows
}

export function parseCSVAdvanced(text: string): CSVParseResult {
  const cleanText = text.replace(/^\uFEFF/, '') // Remove UTF-8 BOM if present
  const lines: string[] = []
  let currentLine = ''
  let inQuotes = false

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const nextChar = cleanText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine)
      }
      currentLine = ''
    } else {
      currentLine += char
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine)
  }

  if (lines.length === 0) {
    return { headers: [], rows: [], totalRows: 0, detectedTypes: {} }
  }

  const parseLine = (line: string): string[] => {
    const fields: string[] = []
    let field = ''
    let inside = false

    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      const next = line[i + 1]

      if (c === '"') {
        if (inside && next === '"') {
          field += '"'
          i++
        } else {
          inside = !inside
        }
      } else if (c === ',' && !inside) {
        fields.push(field.trim())
        field = ''
      } else {
        field += c
      }
    }
    fields.push(field.trim())
    return fields
  }

  const rawHeaders = parseLine(lines[0])
  const headers = rawHeaders.map((h, index) => h.trim() || `Column_${index + 1}`)

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (values.every(v => !v)) continue // skip empty rows

    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] !== undefined ? values[idx] : ''
    })
    rows.push(row)
  }

  // Auto-detect column data types
  const detectedTypes: Record<string, 'text' | 'number' | 'date'> = {}
  headers.forEach(h => {
    let isNumber = true
    let isDate = true
    let sampleCount = 0

    for (const row of rows.slice(0, 100)) {
      const val = row[h]?.trim()
      if (!val) continue
      sampleCount++

      if (isNaN(Number(val))) {
        isNumber = false
      }
      if (isNaN(Date.parse(val))) {
        isDate = false
      }
    }

    if (sampleCount > 0 && isNumber) {
      detectedTypes[h] = 'number'
    } else if (sampleCount > 0 && isDate && !isNumber) {
      detectedTypes[h] = 'date'
    } else {
      detectedTypes[h] = 'text'
    }
  })

  return {
    headers,
    rows,
    totalRows: rows.length,
    detectedTypes,
  }
}

export function validateQuestionCSV(data: any[]): boolean {
  const requiredFields = ['question', 'option a', 'option b', 'correct']
  return data.every(row => {
    const keys = Object.keys(row).map(k => k.toLowerCase())
    return requiredFields.some(req => keys.includes(req))
  })
}

export function mapCSVFields<T = any>(
  rows: Record<string, string>[],
  fieldMapping: Record<string, string>
): T[] {
  return rows.map(row => {
    const mapped: any = {}
    for (const [targetKey, sourceColumn] of Object.entries(fieldMapping)) {
      mapped[targetKey] = row[sourceColumn] || ''
    }
    return mapped as T
  })
}
