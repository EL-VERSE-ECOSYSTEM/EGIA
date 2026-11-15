export type SubjectPerformance = {
  department: string
  subject: string
  averageScore: number
  assessments: number
}

function formatSubject(score: SubjectPerformance) {
  return `${score.department ? `${score.department} department, ` : ''}${score.subject}: ${score.averageScore}% across ${score.assessments} recent assessments`
}

export function formatStudentSubjectPerformance(scores: SubjectPerformance[]) {
  if (!scores.length) return ''

  const lowerAverages = [...scores]
    .sort((left, right) => left.averageScore - right.averageScore)
    .slice(0, 5)
  const higherAverages = [...scores]
    .sort((left, right) => right.averageScore - left.averageScore)
    .slice(0, 5)

  return [
    `Recent subject performance (last 180 days): ${scores.map(formatSubject).join('; ')}.`,
    `Relative areas to practice (lower recent averages): ${lowerAverages.map(formatSubject).join('; ')}.`,
    `Relative strengths (higher recent averages): ${higherAverages.map(formatSubject).join('; ')}.`,
    'Use these as learning signals, not labels of ability; scores with few assessments are uncertain.',
  ].join(' ')
}
