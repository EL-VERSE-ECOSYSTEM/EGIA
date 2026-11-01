export const ALLOWED_TOURNAMENT_GAMES = [
  'CHESS',
  'MATH',
  'SCRAMBLE',
  'SUDOKU',
  'TRIVIA',
  'SCRABBLE',
  'MONOPOLY'
] as const

export type TournamentGameType = typeof ALLOWED_TOURNAMENT_GAMES[number]

export const MAX_POINTS_PER_ROUND = 50

export function validateTournamentGameType(gameType: string): TournamentGameType | null {
  if (!gameType || typeof gameType !== 'string') return null
  const normalized = gameType.trim().toUpperCase()
  if (ALLOWED_TOURNAMENT_GAMES.includes(normalized as TournamentGameType)) {
    return normalized as TournamentGameType
  }
  return null
}

export function clampTournamentPoints(points: unknown): number {
  const parsed = Math.floor(Number(points) || 0)
  if (parsed <= 0) return 0
  return Math.min(parsed, MAX_POINTS_PER_ROUND)
}
