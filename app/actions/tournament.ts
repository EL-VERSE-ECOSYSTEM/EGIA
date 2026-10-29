'use server'

import { auth } from '@/lib/auth'
import { cache } from '@/lib/cache'

export interface SchoolTournamentScore {
  schoolId: string
  schoolName: string
  points: number
  rank: number
  matchesWon: number
  totalStudentsActive: number
}

// In-memory real-time inter-school tournament store
const tournamentScoresMap = new Map<string, { schoolName: string; points: number; matchesWon: number; students: Set<string> }>()

// Initialize default school scores for realistic tournament simulation
tournamentScoresMap.set('school-elgoodnews-001', {
  schoolName: 'EL Learners Main Academy',
  points: 1250,
  matchesWon: 14,
  students: new Set(['student-1', 'student-2'])
})
tournamentScoresMap.set('school-grace-002', {
  schoolName: 'Grace Model College',
  points: 980,
  matchesWon: 11,
  students: new Set(['student-3'])
})
tournamentScoresMap.set('school-stcharles-003', {
  schoolName: 'St. Charles Grammar School',
  points: 840,
  matchesWon: 9,
  students: new Set(['student-4'])
})

export async function submitTournamentGameScoreAction(params: {
  gameType: string
  pointsEarned: number
  isWin?: boolean
}) {
  const session = await auth.getSession()
  if (!session?.user) {
    return { success: false, error: 'Authentication required' }
  }

  const schoolId = session.user.schoolId || 'school-elgoodnews-001'
  const userId = session.user.id

  const existing = tournamentScoresMap.get(schoolId) || {
    schoolName: session.user.schoolName || 'Partner Academy',
    points: 0,
    matchesWon: 0,
    students: new Set()
  }

  existing.points += params.pointsEarned
  if (params.isWin) {
    existing.matchesWon += 1
  }
  existing.students.add(userId)

  tournamentScoresMap.set(schoolId, existing)

  return {
    success: true,
    currentSchoolPoints: existing.points,
    schoolName: existing.schoolName
  }
}

export async function getInterSchoolTournamentLeaderboardAction() {
  const scoresArray = Array.from(tournamentScoresMap.entries()).map(([schoolId, data]) => ({
    schoolId,
    schoolName: data.schoolName,
    points: data.points,
    matchesWon: data.matchesWon,
    totalStudentsActive: data.students.size
  }))

  // Sort descending by points
  scoresArray.sort((a, b) => b.points - a.points)

  const rankedScores: SchoolTournamentScore[] = scoresArray.map((s, idx) => ({
    ...s,
    rank: idx + 1
  }))

  return {
    success: true,
    leaderboard: rankedScores,
    nextTournamentRound: 'Friday Inter-School Championship',
    activePhase: 'Bi-Weekly Friday Tournament League'
  }
}
