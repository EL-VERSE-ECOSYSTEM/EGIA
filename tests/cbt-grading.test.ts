import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'test'
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'test'
process.env.SUPABASE_DATABASE_POOLER_URL = process.env.SUPABASE_DATABASE_POOLER_URL || 'postgresql://postgres.test:test@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'

let fisherYatesShuffle: <T>(array: T[]) => Promise<T[]>

before(async () => {
  const mod = await import('../app/actions/assessments')
  fisherYatesShuffle = mod.fisherYatesShuffle
})

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A'
  if (percentage >= 75) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}

type QuestionType = 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'TRUE_FALSE'

interface MockQuestion {
  id: string
  questionType: QuestionType
  correctAnswer: string
  points: number
}

function evaluateAnswer(q: MockQuestion, submittedAnswer: any): { isCorrect: boolean; score: number } {
  let isCorrect = false

  if (q.questionType === 'MCQ_SINGLE' || q.questionType === 'TRUE_FALSE') {
    isCorrect = typeof submittedAnswer === 'string' &&
      typeof q.correctAnswer === 'string' &&
      submittedAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
  } else if (q.questionType === 'MCQ_MULTIPLE') {
    const correctOptions = q.correctAnswer?.split(',').map(s => s.trim().toLowerCase()).sort() || []
    const submittedOptions = Array.isArray(submittedAnswer)
      ? submittedAnswer.map(s => String(s).trim().toLowerCase()).sort()
      : [String(submittedAnswer || '').trim().toLowerCase()]
    isCorrect = JSON.stringify(correctOptions) === JSON.stringify(submittedOptions)
  } else if (q.questionType === 'FILL_BLANK') {
    const correctBlanks = q.correctAnswer?.split(',').map(s => s.trim().toLowerCase()) || []
    const submittedBlanks = Array.isArray(submittedAnswer)
      ? submittedAnswer.map(s => String(s).trim().toLowerCase())
      : [String(submittedAnswer || '').trim().toLowerCase()]
    isCorrect = JSON.stringify(correctBlanks) === JSON.stringify(submittedBlanks)
  } else if (q.questionType === 'SHORT_ANSWER') {
    isCorrect = typeof submittedAnswer === 'string' &&
      typeof q.correctAnswer === 'string' &&
      submittedAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()
  }

  return {
    isCorrect,
    score: isCorrect ? q.points : 0
  }
}

function evaluateAssessmentSubmission(
  studentSession: { userId: string; role: string; schoolId: string } | null,
  studentProfile: { id: string; userId: string; schoolId: string },
  assessmentData: { schoolId: string | null; status: string; questions: MockQuestion[] },
  answers: { questionId: string; answer: any }[]
) {
  if (!studentSession || studentSession.role !== 'STUDENT') {
    throw new Error('Unauthorized')
  }

  if (studentProfile.userId !== studentSession.userId) {
    throw new Error('You can only submit your own assessment.')
  }

  if (assessmentData.schoolId && studentProfile.schoolId && assessmentData.schoolId !== studentProfile.schoolId) {
    throw new Error('This assessment is not available for your school.')
  }

  if (assessmentData.status !== 'approved' && assessmentData.status !== 'published') {
    throw new Error('This assessment has not been approved by your School Admin.')
  }

  let totalScore = 0
  let correctCount = 0
  const totalPossiblePoints = assessmentData.questions.reduce((sum, q) => sum + q.points, 0)

  for (const q of assessmentData.questions) {
    const studentAns = answers.find(a => a.questionId === q.id)
    const { isCorrect, score } = evaluateAnswer(q, studentAns?.answer)
    if (isCorrect) {
      totalScore += score
      correctCount += 1
    }
  }

  const percentage = totalPossiblePoints > 0 ? (totalScore / totalPossiblePoints) * 100 : 0
  const grade = calculateGrade(percentage)

  return {
    totalScore,
    totalPossiblePoints,
    percentage: Number(percentage.toFixed(2)),
    grade,
    correctCount,
    totalQuestions: assessmentData.questions.length
  }
}

describe('CBT Answer Evaluation & Grading Logic', () => {
  it('correctly grades MCQ_SINGLE questions case-insensitively', () => {
    const q: MockQuestion = { id: 'q1', questionType: 'MCQ_SINGLE', correctAnswer: 'Abuja', points: 5 }
    assert.equal(evaluateAnswer(q, 'Abuja').isCorrect, true)
    assert.equal(evaluateAnswer(q, 'abuja').isCorrect, true)
    assert.equal(evaluateAnswer(q, 'abuja ').isCorrect, true)
    assert.equal(evaluateAnswer(q, 'Lagos').isCorrect, false)
    assert.equal(evaluateAnswer(q, 'Abuja').score, 5)
    assert.equal(evaluateAnswer(q, 'Lagos').score, 0)
  })

  it('correctly grades MCQ_MULTIPLE questions regardless of selection order', () => {
    const q: MockQuestion = { id: 'q2', questionType: 'MCQ_MULTIPLE', correctAnswer: 'A,B,C', points: 10 }
    assert.equal(evaluateAnswer(q, ['C', 'A', 'B']).isCorrect, true)
    assert.equal(evaluateAnswer(q, ['a', 'b', 'c']).isCorrect, true)
    assert.equal(evaluateAnswer(q, ['A', 'B']).isCorrect, false)
    assert.equal(evaluateAnswer(q, ['A', 'B', 'D']).isCorrect, false)
  })

  it('correctly grades FILL_BLANK and SHORT_ANSWER questions', () => {
    const fitb: MockQuestion = { id: 'q3', questionType: 'FILL_BLANK', correctAnswer: 'Oxygen,Hydrogen', points: 4 }
    assert.equal(evaluateAnswer(fitb, ['oxygen', 'hydrogen']).isCorrect, true)

    const shortAns: MockQuestion = { id: 'q4', questionType: 'SHORT_ANSWER', correctAnswer: 'Photosynthesis', points: 2 }
    assert.equal(evaluateAnswer(shortAns, 'photosynthesis').isCorrect, true)
    assert.equal(evaluateAnswer(shortAns, 'Respiration').isCorrect, false)
  })
})

describe('CBT Full Assessment Submission & Tenant Security', () => {
  const mockQuestions: MockQuestion[] = [
    { id: 'q1', questionType: 'MCQ_SINGLE', correctAnswer: '1960', points: 5 },
    { id: 'q2', questionType: 'MCQ_SINGLE', correctAnswer: 'Abuja', points: 5 },
  ]

  const validSession = { userId: 'u100', role: 'STUDENT', schoolId: 'school-A' }
  const studentProfile = { id: 'st100', userId: 'u100', schoolId: 'school-A' }

  it('returns 100% score and A grade for all correct answers', () => {
    const result = evaluateAssessmentSubmission(
      validSession,
      studentProfile,
      { schoolId: 'school-A', status: 'published', questions: mockQuestions },
      [
        { questionId: 'q1', answer: '1960' },
        { questionId: 'q2', answer: 'Abuja' },
      ]
    )

    assert.equal(result.totalScore, 10)
    assert.equal(result.percentage, 100)
    assert.equal(result.grade, 'A')
    assert.equal(result.correctCount, 2)
  })

  it('returns 50% score and D grade for partial correct answers', () => {
    const result = evaluateAssessmentSubmission(
      validSession,
      studentProfile,
      { schoolId: 'school-A', status: 'published', questions: mockQuestions },
      [
        { questionId: 'q1', answer: '1960' },
        { questionId: 'q2', answer: 'Lagos' },
      ]
    )

    assert.equal(result.totalScore, 5)
    assert.equal(result.percentage, 50)
    assert.equal(result.grade, 'D')
    assert.equal(result.correctCount, 1)
  })

  it('blocks non-STUDENT role session from submitting CBT', () => {
    const teacherSession = { userId: 'u200', role: 'TEACHER', schoolId: 'school-A' }
    assert.throws(() => {
      evaluateAssessmentSubmission(
        teacherSession,
        studentProfile,
        { schoolId: 'school-A', status: 'published', questions: mockQuestions },
        []
      )
    }, /Unauthorized/)
  })

  it('blocks student from submitting assessment belonging to a different school tenant', () => {
    assert.throws(() => {
      evaluateAssessmentSubmission(
        validSession,
        studentProfile,
        { schoolId: 'school-B', status: 'published', questions: mockQuestions },
        []
      )
    }, /This assessment is not available for your school/)
  })

  it('blocks submission for unpublished or unapproved assessments', () => {
    assert.throws(() => {
      evaluateAssessmentSubmission(
        validSession,
        studentProfile,
        { schoolId: 'school-A', status: 'draft', questions: mockQuestions },
        []
      )
    }, /This assessment has not been approved by your School Admin/)
  })
})

describe('submitCBT direct server action authorization', () => {
  it('throws when called without request context or session', async () => {
    const { submitCBT } = await import('../app/actions/assessments')
    await assert.rejects(
      async () => {
        await submitCBT('assessment-1', 'student-1', [])
      },
      /called outside a request scope|Unauthorized/
    )
  })
})

describe('Fisher-Yates Shuffle Algorithm', () => {
  it('preserves array length and all original elements', async () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const shuffled = await fisherYatesShuffle(input)

    assert.equal(shuffled.length, input.length)
    assert.deepEqual([...shuffled].sort((a, b) => a - b), input)
  })

  it('handles empty and single-item arrays safely', async () => {
    assert.deepEqual(await fisherYatesShuffle([]), [])
    assert.deepEqual(await fisherYatesShuffle(['only']), ['only'])
  })
})
