import { db } from './db'
import { abacPolicy } from './db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { canSchoolAdminAccess } from '@/lib/auth/school-admin-permissions'

export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'grade'
export type Resource =
  | 'assessment'
  | 'result'
  | 'student'
  | 'teacher'
  | 'parent'
  | 'payment'
  | 'message'
  | 'dispute'
  | 'class'
  | 'academicSession'
  | 'term'

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
  const session = await auth.getSession()
  const activeUser = session?.user?.id === userId ? session.user : null
  const normalizedRole = (activeUser?.role || role || '').toUpperCase()
  const adminLevel = activeUser?.adminLevel || null

  if (normalizedRole === 'SCHOOL_ADMIN') {
    if (!adminLevel || !canSchoolAdminAccess(adminLevel, action, resourceName, resourceData?.operation)) {
      return false
    }
    if (activeUser?.schoolId && resourceData?.schoolId && activeUser.schoolId !== resourceData.schoolId) {
      return false
    }
    if (
      adminLevel.startsWith('HOD_') &&
      activeUser?.department &&
      resourceData?.department &&
      activeUser.department.toLowerCase() !== String(resourceData.department).toLowerCase()
    ) {
      return false
    }
  }

  // 1. Fetch applicable policies from DB sorted by priority (highest priority evaluated first)
  const policies = await db.query.abacPolicy.findMany({
    where: and(
      eq(abacPolicy.role, normalizedRole),
      eq(abacPolicy.resource, resourceName),
      eq(abacPolicy.action, action)
    ),
    orderBy: (abacPolicy, { desc }) => [desc(abacPolicy.priority)],
  })

  const context: EvaluationContext = {
    user: {
      id: userId,
      role: normalizedRole,
      schoolId: activeUser?.schoolId,
      adminLevel,
      department: activeUser?.department,
    },
    resource: resourceData || {}
  }

  // 2. Evaluate DB policies with strict precedence (First matching condition determines ALLOW/DENY)
  if (policies.length > 0) {
    for (const policy of policies) {
      const conditions = policy.conditions as any
      if (evaluateConditions(conditions, context)) {
        return policy.effect === 'ALLOW'
      }
    }
    return false
  }

  // 3. Explicit RBAC Fallback Logic (When no custom ABAC rules match in DB)
  if (normalizedRole === 'SUPER_ADMIN') {
    return true
  }

  if (normalizedRole === 'ADMIN' || normalizedRole === 'PRIMARY_ADMIN') {
    return true
  }

  if (normalizedRole === 'SCHOOL_ADMIN') {
    return canSchoolAdminAccess(adminLevel, action, resourceName, resourceData?.operation)
  }

  if (normalizedRole === 'TEACHER') {
    const allowedTeacherResources: Resource[] = ['assessment', 'result', 'message', 'dispute', 'student', 'class']
    if (allowedTeacherResources.includes(resourceName)) {
      if (action === 'delete') return false
      return true
    }
  }

  if (normalizedRole === 'STUDENT') {
    if (resourceName === 'message') {
      return action === 'read' || action === 'create'
    }
    if (resourceName === 'assessment' || resourceName === 'result') {
      return action === 'read'
    }
  }

  if (normalizedRole === 'PARENT') {
    if (resourceName === 'message') {
      return action === 'read' || action === 'create'
    }
    if (resourceName === 'student' || resourceName === 'result' || resourceName === 'payment') {
      return action === 'read'
    }
  }

  // Default Deny
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
