import test from 'node:test'
import assert from 'node:assert/strict'
import { isCrossOriginLearnAiRequest, LEARN_AI_PACKAGES, LEARN_AI_ROLES } from '../lib/learn-ai'

test('Learn AI monthly token packages keep the published token and NGN prices', () => {
  assert.deepEqual(LEARN_AI_PACKAGES, {
    starter: { tokens: 35, priceNgn: 5200 },
    standard: { tokens: 50, priceNgn: 6800 },
    plus: { tokens: 75, priceNgn: 8000 },
    maximum: { tokens: 100, priceNgn: 10400 },
  })
})

test('Learn AI authorization covers each supported school role', () => {
  for (const role of ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'PUPIL']) {
    assert.equal(LEARN_AI_ROLES.has(role), true)
  }
  assert.equal(LEARN_AI_ROLES.has('GUEST'), false)
})

test('Learn AI rejects cross-origin requests while allowing same-origin and server requests', () => {
  assert.equal(isCrossOriginLearnAiRequest(new Request('https://school.example/api/learn-ai/chat')), false)
  assert.equal(isCrossOriginLearnAiRequest(new Request('https://school.example/api/learn-ai/chat', {
    headers: { origin: 'https://school.example' },
  })), false)
  assert.equal(isCrossOriginLearnAiRequest(new Request('https://school.example/api/learn-ai/chat', {
    headers: { origin: 'https://attacker.example' },
  })), true)
  assert.equal(isCrossOriginLearnAiRequest(new Request('https://school.example/api/learn-ai/chat', {
    headers: { origin: 'null' },
  })), true)
})