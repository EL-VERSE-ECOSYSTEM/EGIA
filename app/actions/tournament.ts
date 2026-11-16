'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tournamentScores, school as schoolTable, student, user as userTable } from '@/lib/db/schema'
import { eq, sql, and, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { isGlobalCompetitionFriday, getNigeriaCompetitionDate, getCompetitionDaysLabel, validateTournamentGameType, clampTournamentPoints } from '@/lib/tournament'

export interface SchoolTournamentScore {
  schoolId: string
  schoolName: string
  points: number
  rank: number
  matchesWon: number
  totalStudentsActive: number
}

export async function submitTournamentGameScoreAction(params: {
  gameType: string
  pointsEarned: number
  isWin?: boolean
}) {
  const session = await auth.getSession()
  if (!session?.user || !['STUDENT', 'PUPIL'].includes(session.user.role.toUpperCase())) {
    return { success: false, error: 'Only student and pupil accounts can submit competition scores.' }
  }
  const gameType = validateTournamentGameType(params.gameType)
  if (!gameType) return { success: false, error: 'Unsupported competition game.' }
  const points = clampTournamentPoints(params.pointsEarned)
  if (points <= 0) return { success: false, error: 'A completed game must score at least one point.' }

  const [account] = await db.select({ userId: userTable.id, schoolId: userTable.schoolId, studentId: student.id })
    .from(userTable).innerJoin(student, eq(student.userId, userTable.id))
    .where(and(eq(userTable.id, session.user.id), eq(student.schoolId, userTable.schoolId)))
    .limit(1)
  if (!account?.schoolId || !account.studentId) return { success: false, error: 'Your learner profile is not linked to an active school.' }

  const competitionDate = getNigeriaCompetitionDate()
  const globalEligible = isGlobalCompetitionFriday()
  const now = new Date()
  try {
    await db.insert(tournamentScores).values([
      { id: randomUUID(), schoolId: account.schoolId, studentId: account.userId, gameType, points, isWin: Boolean(params.isWin), competitionScope: 'SCHOOL', competitionDate, createdAt: now },
      ...(globalEligible ? [{ id: randomUUID(), schoolId: account.schoolId, studentId: account.userId, gameType, points, isWin: Boolean(params.isWin), competitionScope: 'GLOBAL' as const, competitionDate, createdAt: now }] : []),
    ])
  } catch (error) {
    console.error('[Tournament] Could not save competition score.', error)
    return { success: false, error: 'The competition score could not be saved.' }
  }
  return { success: true, pointsAdded: points, schoolId: account.schoolId, competitionDate, globalEligible }
}

export async function getCompetitionLeaderboardsAction() {
  const session = await auth.getSession()
  if (!session?.user) return { success: false, error: 'Sign in to view competition rankings.', schools: [], learners: [], schoolLearners: [], globalEligible: false, competitionDate: getNigeriaCompetitionDate() }
  const competitionDate = getNigeriaCompetitionDate()
  try {
    const schoolResult = await db.execute(sql`
      SELECT s.id AS "schoolId", s.name AS "schoolName",
             COALESCE(SUM(ts.points), 0)::int AS points,
             COUNT(*) FILTER (WHERE ts.is_win)::int AS "matchesWon",
             COUNT(DISTINCT ts.student_id)::int AS "totalStudentsActive"
      FROM public.school s
      INNER JOIN public.tournament_scores ts ON ts.school_id = s.id AND ts.competition_scope = 'GLOBAL'
      GROUP BY s.id, s.name
      ORDER BY points DESC, "matchesWon" DESC, s.name ASC
      LIMIT 100
    `)
    const studentResult = await db.execute(sql`
      SELECT ts.student_id AS "userId", COALESCE(u.name, s.firstname || ' ' || s.lastname) AS "learnerName",
             s.class AS "className", sc.name AS "schoolName",
             COALESCE(SUM(ts.points), 0)::int AS points,
             COUNT(*) FILTER (WHERE ts.is_win)::int AS wins,
             COUNT(*)::int AS games
      FROM public.tournament_scores ts
      INNER JOIN public."user" u ON u.id = ts.student_id
      INNER JOIN public.student s ON s.userid = u.id
      INNER JOIN public.school sc ON sc.id = ts.school_id
      WHERE ts.competition_scope = 'GLOBAL'
      GROUP BY ts.student_id, u.name, s.firstname, s.lastname, s.class, sc.name
      ORDER BY points DESC, wins DESC, "learnerName" ASC
      LIMIT 100
    `)
    const schoolRows: any[] = (schoolResult as any)?.rows ?? schoolResult as any
    const learnerRows: any[] = (studentResult as any)?.rows ?? studentResult as any
    const schoolId = session.user.schoolId
    const schoolLearnerResult = schoolId ? await db.execute(sql`
      SELECT ts.student_id AS "userId", COALESCE(u.name, s.firstname || ' ' || s.lastname) AS "learnerName",
             s.class AS "className", COALESCE(SUM(ts.points), 0)::int AS points,
             COUNT(*) FILTER (WHERE ts.is_win)::int AS wins, COUNT(*)::int AS games
      FROM public.tournament_scores ts
      INNER JOIN public."user" u ON u.id = ts.student_id
      INNER JOIN public.student s ON s.userid = u.id AND s.schoolid = ts.school_id
      WHERE ts.competition_scope = 'SCHOOL' AND ts.school_id = ${schoolId}
      GROUP BY ts.student_id, u.name, s.firstname, s.lastname, s.class
      ORDER BY points DESC, wins DESC, "learnerName" ASC LIMIT 100
    `) : []
    const schoolLearnerRows: any[] = (schoolLearnerResult as any)?.rows ?? schoolLearnerResult as any
    return {
      success: true,
      schools: (Array.isArray(schoolRows) ? schoolRows : []).map((row, index) => ({ ...row, points: Number(row.points || 0), matchesWon: Number(row.matchesWon || 0), totalStudentsActive: Number(row.totalStudentsActive || 0), rank: index + 1 })),
      learners: (Array.isArray(learnerRows) ? learnerRows : []).map((row, index) => ({ ...row, points: Number(row.points || 0), wins: Number(row.wins || 0), games: Number(row.games || 0), rank: index + 1 })),
      schoolLearners: (Array.isArray(schoolLearnerRows) ? schoolLearnerRows : []).map((row, index) => ({ ...row, points: Number(row.points || 0), wins: Number(row.wins || 0), games: Number(row.games || 0), rank: index + 1 })),
      competitionDate,
      globalEligible: isGlobalCompetitionFriday(),
      schedule: getCompetitionDaysLabel(),
    }
  } catch (error) {
    console.error('[Tournament] Leaderboard query failed.', error)
    return { success: false, error: 'Competition rankings are temporarily unavailable.', schools: [], learners: [], schoolLearners: [], globalEligible: isGlobalCompetitionFriday(), competitionDate, schedule: getCompetitionDaysLabel() }
  }
}

export async function getInterSchoolTournamentLeaderboardAction() {
  const result = await getCompetitionLeaderboardsAction()
  return { ...result, leaderboard: result.success ? result.schools : [], nextTournamentRound: result.schedule, activePhase: result.globalEligible ? 'Global competition day' : 'School games are open' }
}
