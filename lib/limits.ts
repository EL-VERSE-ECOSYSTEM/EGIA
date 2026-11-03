import { db } from '@/lib/db'
import { schoolResourceLimits } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export interface ResourceLimits {
  maxStudents: number;
  maxStorageBytes: number;
  maxDailyExports: number;
  maxConcurrentExports: number;
  maxDailyAiRequests: number;
  maxCbtSessions: number;
  maxApiRequestsPerMinute: number;
  maxBulkImportRows: number;
  maxNotificationBatch: number;
}

export const DEFAULT_RESOURCE_LIMITS: ResourceLimits = {
  maxStudents: 2000,
  maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
  maxDailyExports: 50,
  maxConcurrentExports: 3,
  maxDailyAiRequests: 500,
  maxCbtSessions: 100,
  maxApiRequestsPerMinute: 300,
  maxBulkImportRows: 1000,
  maxNotificationBatch: 500,
}

/**
 * Retrieves the resource limits for a specific school.
 * Returns safe default limits if no custom record is configured.
 */
export async function getSchoolResourceLimits(schoolId?: string | null): Promise<ResourceLimits> {
  if (!schoolId) {
    return DEFAULT_RESOURCE_LIMITS
  }

  try {
    const records = await db
      .select()
      .from(schoolResourceLimits)
      .where(eq(schoolResourceLimits.schoolId, schoolId))
      .limit(1)

    if (records.length === 0) {
      return DEFAULT_RESOURCE_LIMITS
    }

    const r = records[0]
    return {
      maxStudents: r.maxStudents ?? DEFAULT_RESOURCE_LIMITS.maxStudents,
      maxStorageBytes: Number(r.maxStorageBytes ?? DEFAULT_RESOURCE_LIMITS.maxStorageBytes),
      maxDailyExports: r.maxDailyExports ?? DEFAULT_RESOURCE_LIMITS.maxDailyExports,
      maxConcurrentExports: r.maxConcurrentExports ?? DEFAULT_RESOURCE_LIMITS.maxConcurrentExports,
      maxDailyAiRequests: r.maxDailyAiRequests ?? DEFAULT_RESOURCE_LIMITS.maxDailyAiRequests,
      maxCbtSessions: r.maxCbtSessions ?? DEFAULT_RESOURCE_LIMITS.maxCbtSessions,
      maxApiRequestsPerMinute: r.maxApiRequestsPerMinute ?? DEFAULT_RESOURCE_LIMITS.maxApiRequestsPerMinute,
      maxBulkImportRows: r.maxBulkImportRows ?? DEFAULT_RESOURCE_LIMITS.maxBulkImportRows,
      maxNotificationBatch: r.maxNotificationBatch ?? DEFAULT_RESOURCE_LIMITS.maxNotificationBatch,
    }
  } catch (error) {
    console.warn(`Failed to fetch resource limits for school ${schoolId}, falling back to defaults:`, error)
    return DEFAULT_RESOURCE_LIMITS
  }
}

/**
 * Validates whether a proposed quantity fits within the school's configured limit.
 */
export async function checkQuota(
  schoolId: string | undefined | null,
  quotaKey: keyof ResourceLimits,
  currentCount: number,
  additionalCount = 1
): Promise<{ allowed: boolean; limit: number; remaining: number }> {
  const limits = await getSchoolResourceLimits(schoolId)
  const limit = limits[quotaKey]
  const proposedTotal = currentCount + additionalCount
  const remaining = Math.max(0, limit - currentCount)

  return {
    allowed: proposedTotal <= limit,
    limit,
    remaining,
  }
}
