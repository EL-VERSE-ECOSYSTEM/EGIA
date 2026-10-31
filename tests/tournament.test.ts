import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ALLOWED_TOURNAMENT_GAMES,
  validateTournamentGameType,
  clampTournamentPoints,
  MAX_POINTS_PER_ROUND
} from '../lib/tournament'

test('Tournament Engine Validation & Clamping', async (t) => {
  await t.test('validates permitted educational games', () => {
    for (const game of ALLOWED_TOURNAMENT_GAMES) {
      assert.equal(validateTournamentGameType(game), game)
      assert.equal(validateTournamentGameType(game.toLowerCase()), game)
    }
    assert.equal(validateTournamentGameType('INVALID_GAME'), null)
    assert.equal(validateTournamentGameType(''), null)
  })

  await t.test('clamps tournament points between 0 and MAX_POINTS_PER_ROUND', () => {
    assert.equal(clampTournamentPoints(25), 25)
    assert.equal(clampTournamentPoints(0), 0)
    assert.equal(clampTournamentPoints(-10), 0)
    assert.equal(clampTournamentPoints(1000), MAX_POINTS_PER_ROUND)
    assert.equal(clampTournamentPoints('40'), 40)
    assert.equal(clampTournamentPoints('not-a-number'), 0)
  })
})
