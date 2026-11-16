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
export type CompetitionScope = 'GLOBAL' | 'SCHOOL'

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

export function getNigeriaCompetitionDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function isGlobalCompetitionFriday(date = new Date()) {
  const localDate = getNigeriaCompetitionDate(date)
  const [year, month, day] = localDate.split('-').map(Number)
  const dateUtc = new Date(Date.UTC(year, month - 1, day))
  if (dateUtc.getUTCDay() !== 5) return false
  const nextFriday = new Date(dateUtc)
  nextFriday.setUTCDate(nextFriday.getUTCDate() + 7)
  const isSecondFriday = day >= 8 && day <= 14
  const isLastFriday = nextFriday.getUTCMonth() !== dateUtc.getUTCMonth()
  return isSecondFriday || isLastFriday
}

export function getCompetitionDaysLabel() {
  return 'Second and last Friday of every month (Africa/Lagos time)'
}
