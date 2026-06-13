import { db } from './db'
import { abacPolicy } from './db/schema'
import { eq, and } from 'drizzle-orm'

export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'grade'
export type Resource = 'assessment' | 'result' | 'student' | 'teacher' | 'parent' | 'payment' | 'message' | 'dispute' | 'class'

interface EvaluationContext {
  user: {
    id: string
    role: string
    [key: string]: any
  }
  resource: {
    [key: string]: any
  }
}

export async function checkPermission(
  userId: string,
  role: string,
  action: Action,
  resourceName: Resource,
  resourceData?: any
): Promise<boolean> {
  // 1. Fetch applicable policies from DB
  const policies = await db.query.abacPolicy.findMany({
    where: and(
      eq(abacPolicy.role, role),
      eq(abacPolicy.resource, resourceName),
      eq(abacPolicy.action, action)
    ),
    orderBy: (abacPolicy, { desc }) => [desc(abacPolicy.priority)],
  })

  const context: EvaluationContext = {
    user: { id: userId, role },
    resource: resourceData || {}
  }

  // 2. If policies exist, evaluate them
  if (policies.length > 0) {
    for (const policy of policies) {
      const conditions = policy.conditions as any
      if (evaluateConditions(conditions, context)) {
        return policy.effect === 'ALLOW'
      }
    }
    // If we have policies but none matched, or last match was DENY, we follow the last match or deny
    return false
  }

  // 3. Fallback RBAC Logic (when no specific ABAC policies are seeded in DB)
  if (role === 'admin') return true

  if (role === 'teacher') {
    const allowedResources = ['assessment', 'result', 'message', 'dispute', 'student', 'class']
    if (allowedResources.includes(resourceName)) {
      if (action === 'delete') return false // Even teachers shouldn't delete without policy
      return true
    }
  }

  if (role === 'student') {
    if (resourceName === 'result' || resourceName === 'message' || resourceName === 'assessment') {
      // Students can read assessments/messages/results, and create results (i.e., take assessments)
      return action === 'read' || (action === 'create' && resourceName === 'result')
    }
  }

  if (role === 'parent') {
    if (resourceName === 'student' || resourceName === 'result' || resourceName === 'payment' || resourceName === 'message') {
      return action === 'read' || (action === 'create' && resourceName === 'payment')
    }
  }

  return false
}

function evaluateConditions(conditions: any, context: EvaluationContext): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true

  return Object.entries(conditions).every(([key, expectedValue]) => {
    const actualValue = getContextValue(key, context)

    if (typeof expectedValue === 'string' && (expectedValue.startsWith('user.') || expectedValue.startsWith('resource.'))) {
        return actualValue === getContextValue(expectedValue as string, context)
    }

    return actualValue === expectedValue
  })
}

function getContextValue(path: string, context: EvaluationContext): any {
  const parts = path.split('.')
  let current: any = context
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }
  return current
}
