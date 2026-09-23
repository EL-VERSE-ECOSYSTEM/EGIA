import test from 'node:test'
import assert from 'node:assert/strict'
import {
  sanitizeCSVFormula,
  parseCSV,
  parseCSVAdvanced,
  validateQuestionCSV,
  mapCSVFields,
} from '../lib/csv-parser'

test('sanitizeCSVFormula preserves valid negative numbers and sanitizes formula expressions', () => {
  // Valid numbers should be preserved
  assert.equal(sanitizeCSVFormula('-5'), '-5')
  assert.equal(sanitizeCSVFormula('-10.5'), '-10.5')
  assert.equal(sanitizeCSVFormula('+100'), '+100')

  // Formula injections should be prepended with single quote
  assert.equal(sanitizeCSVFormula('=1+1'), "'=1+1")
  assert.equal(sanitizeCSVFormula('@SUM(A1:A10)'), "'@SUM(A1:A10)")
  assert.equal(sanitizeCSVFormula('-1+1'), "'-1+1")
  assert.equal(sanitizeCSVFormula('+1+1'), "'+1+1")
  assert.equal(sanitizeCSVFormula('\tcmd'), "'\tcmd")
})

test('parseCSVAdvanced removes UTF-8 BOM and parses simple CSV data correctly', () => {
  const csv = '\uFEFFName,Age,Score\nAlice,25,95\nBob,30,-5'
  const result = parseCSVAdvanced(csv)

  assert.deepEqual(result.headers, ['Name', 'Age', 'Score'])
  assert.equal(result.totalRows, 2)
  assert.equal(result.rows[0].Name, 'Alice')
  assert.equal(result.rows[0].Age, '25')
  assert.equal(result.rows[0].Score, '95')
  assert.equal(result.rows[1].Name, 'Bob')
  assert.equal(result.rows[1].Score, '-5')
  assert.equal(result.detectedTypes.Score, 'number')
})

test('parseCSV handles multiline quoted fields and escaped quotes in CSV', () => {
  const csv = `"Question Text","Option A","Correct Answer"
"What is the capital
of Nigeria?","Lagos","Abuja"
"She said ""Hello!""","Yes","Yes"`

  const rows = parseCSV(csv)

  assert.equal(rows.length, 2)
  assert.equal(rows[0]['Question Text'], 'What is the capital\nof Nigeria?')
  assert.equal(rows[0]['Correct Answer'], 'Abuja')
  assert.equal(rows[1]['Question Text'], 'She said "Hello!"')
})

test('parseCSVAdvanced populates normalized alias keys on every row record', () => {
  const csv = `Question Text,Option A,Option B,Correct Answer,Publication Year,Class Level
"What is 2+2?","3","4","4","2026","SSS 1"`

  const result = parseCSVAdvanced(csv)
  const row = result.rows[0]

  // Exact header keys
  assert.equal(row['Question Text'], 'What is 2+2?')
  assert.equal(row['Correct Answer'], '4')

  // Normalized alias keys
  assert.equal(row.questionText, 'What is 2+2?')
  assert.equal(row.question, 'What is 2+2?')
  assert.equal(row.correctAnswer, '4')
  assert.equal(row.answer, '4')
  assert.equal(row.correct, '4')
  assert.equal(row.optionA, '3')
  assert.equal(row.optionB, '4')
  assert.equal(row.publicationYear, '2026')
  assert.equal(row.classLevel, 'SSS 1')
})

test('validateQuestionCSV correctly identifies valid vs invalid question sets', () => {
  const validRows = [
    { questionText: 'What is 2+2?', correctAnswer: '4' },
    { Question: 'Capital of France?', Answer: 'Paris' },
  ]
  const invalidRows = [
    { title: 'Algebra Book', author: 'Jane Doe' },
  ]

  assert.equal(validateQuestionCSV(validRows), true)
  assert.equal(validateQuestionCSV(invalidRows), false)
  assert.equal(validateQuestionCSV([]), false)
})

test('mapCSVFields maps CSV row columns to custom target object structure', () => {
  const rows = [
    { 'Question Text': 'What is 3+3?', 'Correct Answer': '6' },
  ]

  const mapped = mapCSVFields(rows, {
    q: 'Question Text',
    a: 'Correct Answer',
  })

  assert.deepEqual(mapped, [
    { q: 'What is 3+3?', a: '6' },
  ])
})
