import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeReportCardMarks } from '../lib/report-cards/marks'

describe('Report-card score validation', () => {
  it('recomputes total and grade from standard and additional score sections', () => {
    const [mark] = normalizeReportCardMarks([{
      subject: 'Mathematics',
      testScore: 25,
      examScore: 60,
      otherScores: [{ label: 'Project', score: 10, maxScore: 10 }],
    }])

    assert.equal(mark.total, 86)
    assert.equal(mark.grade, 'A')
    assert.deepEqual(mark.otherScores, [{ label: 'Project', score: 10, maxScore: 10 }])
  })

  it('rejects scores above their allowed maximum and duplicate subjects', () => {
    assert.throws(() => normalizeReportCardMarks([{
      subject: 'Mathematics',
      testScore: 31,
      examScore: 60,
    }]), /test score must be between 0 and 30/)

    assert.throws(() => normalizeReportCardMarks([
      { subject: 'Mathematics', testScore: 20, examScore: 60 },
      { subject: ' mathematics ', testScore: 20, examScore: 60 },
    ]), /subject can only appear once/)
  })

  it('rejects additional sections with invalid maxima or scores', () => {
    assert.throws(() => normalizeReportCardMarks([{
      subject: 'Science',
      testScore: 20,
      examScore: 60,
      otherScores: [{ label: 'Practical', score: 12, maxScore: 10 }],
    }]), /additional scores need a label and a score within the maximum/)
  })
})
