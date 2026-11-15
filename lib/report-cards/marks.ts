export type ReportCardScore = {
  label: string
  score: number
  maxScore: number
}

export type ReportCardMark = {
  subject: string
  testScore: number
  examScore: number
  otherScores?: ReportCardScore[]
  total: number
  grade: string
}

export function normalizeReportCardMarks(value: unknown): ReportCardMark[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    throw new Error('Add between 1 and 40 subject score entries.')
  }

  const marks: ReportCardMark[] = value.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new Error('Invalid subject score entry.')
    const row = entry as Record<string, unknown>
    const subjectName = typeof row.subject === 'string' ? row.subject.trim() : ''
    const testScore = Number(row.testScore)
    const examScore = Number(row.examScore)
    if (!subjectName || subjectName.length > 100) throw new Error('Each score must have a valid subject.')
    if (!Number.isFinite(testScore) || testScore < 0 || testScore > 30) {
      throw new Error(`${subjectName}: test score must be between 0 and 30.`)
    }
    if (!Number.isFinite(examScore) || examScore < 0 || examScore > 70) {
      throw new Error(`${subjectName}: exam score must be between 0 and 70.`)
    }

    const rawOtherScores = row.otherScores === undefined ? [] : row.otherScores
    if (!Array.isArray(rawOtherScores) || rawOtherScores.length > 20) {
      throw new Error(`${subjectName}: add no more than 20 additional score sections.`)
    }
    const otherScores = rawOtherScores.map((item) => {
      if (!item || typeof item !== 'object') throw new Error(`${subjectName}: invalid additional score section.`)
      const scoreRow = item as Record<string, unknown>
      const label = typeof scoreRow.label === 'string' ? scoreRow.label.trim() : ''
      const score = Number(scoreRow.score)
      const maxScore = Number(scoreRow.maxScore)
      if (!label || label.length > 60 || !Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 100 ||
        !Number.isFinite(score) || score < 0 || score > maxScore) {
        throw new Error(`${subjectName}: additional scores need a label and a score within the maximum.`)
      }
      return { label, score, maxScore }
    })

    const earned = testScore + examScore + otherScores.reduce((total, item) => total + item.score, 0)
    const possible = 100 + otherScores.reduce((total, item) => total + item.maxScore, 0)
    const total = Math.round((earned / possible) * 100)
    const grade = total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : total >= 50 ? 'D' : total >= 40 ? 'E' : 'F'
    return { subject: subjectName, testScore, examScore, otherScores, total, grade }
  })

  if (new Set(marks.map((mark) => mark.subject.toLocaleLowerCase())).size !== marks.length) {
    throw new Error('A subject can only appear once on a report card.')
  }
  return marks
}
