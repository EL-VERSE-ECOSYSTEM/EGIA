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

export function sanitizeCSVFormula(val: string): string {
  if (typeof val === 'string' && /^[=+\-@\t\r]/.test(val)) {
    // Preserve valid numeric values (e.g. -5, +12, -100.5, -0.01) rather than treating as formula injection
    const trimmed = val.trim()
    if (/^[-+]?\d+(\.\d+)?$/.test(trimmed)) {
      return val
    }
    return `'${val}`
  }
  return val
}

export function parseCSVAdvanced(text: string): CSVParseResult {
  const cleanText = text.replace(/^\uFEFF/, '')
  const lines: string[] = []
  let currentLine = ''
  let inQuotes = false

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const nextChar = cleanText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '""'
        i++
      } else {
        inQuotes = !inQuotes
        currentLine += '"'
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
        fields.push(sanitizeCSVFormula(field.trim()))
        field = ''
      } else {
        field += c
      }
    }
    fields.push(sanitizeCSVFormula(field.trim()))
    return fields
  }

  const rawHeaders = parseLine(lines[0])
  const headers = rawHeaders.map((h, index) => h.trim() || `Column_${index + 1}`)

  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    if (values.every(v => !v)) continue

    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      const val = values[idx] !== undefined ? values[idx] : ''
      row[header] = val

      // Generate normalized alias keys so callers can look up properties flexibly
      const trimmedHeader = header.trim()
      const lower = trimmedHeader.toLowerCase()
      const stripped = lower.replace(/[^a-z0-9]/g, '')
      const snake = lower.replace(/[\s-]+/g, '_')
      const camel = lower.replace(/[\s_-]+([a-z0-9])/g, (_, c) => c.toUpperCase())

      if (trimmedHeader && !(trimmedHeader in row)) row[trimmedHeader] = val
      if (lower && !(lower in row)) row[lower] = val
      if (stripped && !(stripped in row)) row[stripped] = val
      if (snake && !(snake in row)) row[snake] = val
      if (camel && !(camel in row)) row[camel] = val

      // Common domain aliases for question/assessment and library uploads
      if (['questiontext', 'question_text', 'question'].includes(snake) || stripped.includes('question')) {
        if (!('question' in row)) row['question'] = val
        if (!('questionText' in row)) row['questionText'] = val
      }
      if (['correctanswer', 'correct_answer', 'correct', 'answer'].includes(snake) || stripped.includes('correct') || stripped.includes('answer')) {
        if (!('correct' in row)) row['correct'] = val
        if (!('answer' in row)) row['answer'] = val
        if (!('correctAnswer' in row)) row['correctAnswer'] = val
      }
      if (['optiona', 'option_a'].includes(snake) || stripped === 'optiona') {
        if (!('optionA' in row)) row['optionA'] = val
      }
      if (['optionb', 'option_b'].includes(snake) || stripped === 'optionb') {
        if (!('optionB' in row)) row['optionB'] = val
      }
      if (['optionc', 'option_c'].includes(snake) || stripped === 'optionc') {
        if (!('optionC' in row)) row['optionC'] = val
      }
      if (['optiond', 'option_d'].includes(snake) || stripped === 'optiond') {
        if (!('optionD' in row)) row['optionD'] = val
      }
      if (['classlevel', 'class_level', 'class'].includes(snake) || stripped === 'classlevel' || stripped === 'class') {
        if (!('classLevel' in row)) row['classLevel'] = val
        if (!('class_level' in row)) row['class_level'] = val
      }
      if (['publicationyear', 'publication_year', 'year'].includes(snake) || stripped === 'publicationyear' || stripped === 'year') {
        if (!('publicationYear' in row)) row['publicationYear'] = val
        if (!('publication_year' in row)) row['publication_year'] = val
      }
    })
    rows.push(row)
  }

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
  if (!Array.isArray(data) || data.length === 0) return false

  return data.every(row => {
    if (!row || typeof row !== 'object') return false
    const keys = Object.keys(row).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''))
    const hasQuestion = keys.some(k => k.includes('question'))
    const hasAnswer = keys.some(k => k.includes('correct') || k.includes('answer'))
    return hasQuestion && hasAnswer
  })
}

export function mapCSVFields<T = any>(
  rows: Record<string, string>[],
  fieldMapping: Record<string, string>
): T[] {
  return rows.map(row => {
    const mapped: any = {}
    for (const [targetKey, sourceColumn] of Object.entries(fieldMapping)) {
      mapped[targetKey] =
        row[sourceColumn] ||
        row[sourceColumn.toLowerCase()] ||
        row[sourceColumn.replace(/[^a-zA-Z0-9]/g, '')] ||
        ''
    }
    return mapped as T
  })
}
