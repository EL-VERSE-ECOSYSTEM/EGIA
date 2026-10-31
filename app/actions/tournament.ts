'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tournamentScores, school as schoolTable, user as userTable } from '@/lib/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export interface SchoolTournamentScore {
  schoolId: string
  schoolName: string
  points: number
  rank: number
  matchesWon: number
  totalStudentsActive: number
}

import { validateTournamentGameType, clampTournamentPoints } from '@/lib/tournament'

export async function submitTournamentGameScoreAction(params: {
  gameType: string
  pointsEarned: number
  isWin?: boolean
}) {
  const session = await auth.getSession()
  if (!session?.user) {
    return { success: false, error: 'Authentication required to submit tournament score' }
  }

  // Validate allowed game type
  const validatedGame = validateTournamentGameType(params.gameType)
  if (!validatedGame) {
    return { success: false, error: 'Invalid game type for tournament submission' }
  }

  // Clamped point boundaries: prevent manipulation (max 50 points per individual round)
  const safePoints = clampTournamentPoints(params.pointsEarned)
  if (safePoints <= 0) {
    return { success: false, error: 'Score must be greater than 0' }
  }

  const userId = session.user.id

  // Verify user's actual school from database rather than relying on unverified client state
  let resolvedSchoolId = session.user.schoolId
  let resolvedSchoolName = 'Partner Academy'

  try {
    const userRecords = await db
      .select({ schoolId: userTable.schoolId })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1)

    if (userRecords.length > 0 && userRecords[0].schoolId) {
      resolvedSchoolId = userRecords[0].schoolId
    }

    if (resolvedSchoolId) {
      const schoolRecords = await db
        .select({ name: schoolTable.name })
        .from(schoolTable)
        .where(eq(schoolTable.id, resolvedSchoolId))
        .limit(1)

      if (schoolRecords.length > 0 && schoolRecords[0].name) {
        resolvedSchoolName = schoolRecords[0].name
      }
    }
  } catch (err) {
    console.warn('[Tournament] DB lookup fallback:', err)
  }

  if (!resolvedSchoolId) {
    return { success: false, error: 'User is not linked to a registered school' }
  }

  // Persist score transactionally to PostgreSQL
  try {
    await db.insert(tournamentScores).values({
      id: randomUUID(),
      schoolId: resolvedSchoolId,
      studentId: userId,
      gameType: validatedGame,
      points: safePoints,
      isWin: Boolean(params.isWin),
      createdAt: new Date(),
    })
  } catch (err: any) {
    console.error('[Tournament] Failed to persist score to database:', err?.message || err)
    return { success: false, error: 'Failed to record tournament score' }
  }

  return {
    success: true,
    pointsAdded: safePoints,
    schoolName: resolvedSchoolName,
    schoolId: resolvedSchoolId,
  }
}

export async function getInterSchoolTournamentLeaderboardAction() {
  const session = await auth.getSession()
  if (!session?.user) {
    return { success: false, error: 'Authentication required to view tournament leaderboard' }
  }

  try {
    // Query actual aggregated points from tournament_scores joined with school table
    const aggregateQuery = await db.execute(sql`
      SELECT
        s.id AS "schoolId",
        s.name AS "schoolName",
        COALESCE(SUM(ts.points), 0)::integer AS points,
        COALESCE(COUNT(CASE WHEN ts.is_win = true THEN 1 END), 0)::integer AS "matchesWon",
        COALESCE(COUNT(DISTINCT ts.student_id), 0)::integer AS "totalStudentsActive"
      FROM school s
      LEFT JOIN tournament_scores ts ON ts.school_id = s.id
      GROUP BY s.id, s.name
      ORDER BY points DESC, "matchesWon" DESC
      LIMIT 20;
    `)

    const rawRows = (aggregateQuery as any)?.rows ?? aggregateQuery
    const rows: any[] = Array.isArray(rawRows) ? rawRows : []
    const leaderboard: SchoolTournamentScore[] = rows.map((row, index) => ({
      schoolId: row.schoolId,
      schoolName: row.schoolName,
      points: Number(row.points || 0),
      matchesWon: Number(row.matchesWon || 0),
      totalStudentsActive: Number(row.totalStudentsActive || 0),
      rank: index + 1,
    }))

    return {
      success: true,
      leaderboard,
      nextTournamentRound: 'Friday Inter-School Championship',
      activePhase: 'Bi-Weekly Friday Tournament League'
    }
  } catch (err: any) {
    console.warn('[Tournament] DB aggregation failed, returning empty leaderboard:', err?.message || err)
    return {
      success: true,
      leaderboard: [],
      nextTournamentRound: 'Friday Inter-School Championship',
      activePhase: 'Bi-Weekly Friday Tournament League'
    }
  }
}
