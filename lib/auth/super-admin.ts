import 'server-only'
import { db } from '@/lib/db'
import { user as userTable, userRole as userRoleTable } from '@/lib/db/schema'
import { eq, ilike, and } from 'drizzle-orm'

/**
 * Checks in real time whether a given email address belongs to a Super Admin account in the database.
 */
export async function isSuperAdminEmail(email: string | null | undefined): Promise<boolean> {
  if (!email || !email.trim()) return false
  const cleanEmail = email.trim().toLowerCase()
  try {
    const result = await db
      .select({ userId: userTable.id })
      .from(userTable)
      .innerJoin(userRoleTable, eq(userTable.id, userRoleTable.userId))
      .where(and(ilike(userTable.email, cleanEmail), eq(userRoleTable.role, 'SUPER_ADMIN')))
      .limit(1)

    return result.length > 0
  } catch (err) {
    console.warn('isSuperAdminEmail database query failed:', err)
    return false
  }
}

/**
 * Checks in real time whether a given user ID has the SUPER_ADMIN role assigned in the database.
 */
export async function isSuperAdminUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false
  try {
    const result = await db
      .select({ id: userRoleTable.id })
      .from(userRoleTable)
      .where(and(eq(userRoleTable.userId, userId), eq(userRoleTable.role, 'SUPER_ADMIN')))
      .limit(1)

    return result.length > 0
  } catch (err) {
    console.warn('isSuperAdminUser database query failed:', err)
    return false
  }
}

/** Legacy alias for backward compatibility during migration */
export const isConfiguredSuperAdminEmail = isSuperAdminEmail
