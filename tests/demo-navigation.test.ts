import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEMO_ROLES_DATA, DemoRole } from '../lib/demo-data.ts'

describe('App Demo Navigation & Role Coverage Tests', () => {
  it('covers all 5 essential user roles in DEMO_ROLES_DATA', () => {
    const roles: DemoRole[] = ['superadmin', 'schooladmin', 'teacher', 'student', 'parent']
    for (const role of roles) {
      assert.ok(DEMO_ROLES_DATA[role], `Missing demo configuration for role: ${role}`)
      assert.ok(DEMO_ROLES_DATA[role].title, `Missing title for role: ${role}`)
      assert.ok(DEMO_ROLES_DATA[role].summary, `Missing summary for role: ${role}`)
      assert.ok(DEMO_ROLES_DATA[role].keyFeatures.length >= 3, `Expected at least 3 key features for ${role}`)
      assert.ok(DEMO_ROLES_DATA[role].workflows.length >= 2, `Expected at least 2 workflows for ${role}`)
      assert.equal(DEMO_ROLES_DATA[role].loginLink, '/auth/signin')
    }
  })

  it('includes specific high-value workflows for Super Admin and School Admin', () => {
    const superAdmin = DEMO_ROLES_DATA.superadmin
    assert.match(superAdmin.title, /Super Admin/i)
    assert.ok(superAdmin.keyFeatures.some(f => f.includes('Proof of Address')))

    const schoolAdmin = DEMO_ROLES_DATA.schooladmin
    assert.match(schoolAdmin.title, /School Admin/i)
    assert.ok(schoolAdmin.keyFeatures.some(f => f.includes('Fee Structure')))
  })

  it('includes specific student and parent features', () => {
    const student = DEMO_ROLES_DATA.student
    assert.ok(student.keyFeatures.some(f => f.includes('CBT Exam Room')))
    assert.ok(student.keyFeatures.some(f => f.includes('WAEC/NECO/JAMB')))

    const parent = DEMO_ROLES_DATA.parent
    assert.ok(parent.keyFeatures.some(f => f.includes('Korapay Gateway')))
  })
})
