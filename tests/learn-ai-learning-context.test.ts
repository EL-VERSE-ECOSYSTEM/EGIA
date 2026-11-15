import test from 'node:test'
import assert from 'node:assert/strict'
import { formatStudentSubjectPerformance } from '../lib/learn-ai-learning-context'

test('student learning context includes every subject and highlights relative score ranges', () => {
  const context = formatStudentSubjectPerformance([
    { department: 'Science', subject: 'Mathematics', averageScore: 48, assessments: 2 },
    { department: 'Science', subject: 'Biology', averageScore: 84, assessments: 5 },
    { department: 'Arts', subject: 'History', averageScore: 67, assessments: 3 },
  ])

  assert.match(context, /Mathematics: 48%/)
  assert.match(context, /Biology: 84%/)
  assert.match(context, /History: 67%/)
  assert.match(context, /Relative areas to practice .*Mathematics/)
  assert.match(context, /Relative strengths .*Biology/)
  assert.match(context, /scores with few assessments are uncertain/)
})

test('student learning context is empty when there are no recorded scores', () => {
  assert.equal(formatStudentSubjectPerformance([]), '')
})
