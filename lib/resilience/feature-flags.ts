import { db } from '@/lib/db'
import { systemFeatureFlags } from '@/lib/db/schema'
import { eq, or, and } from 'drizzle-orm'

// Safe default values for critical emergency flags
const SAFE_FLAG_DEFAULTS: Record<string, boolean> = {
  maintenance_mode: false,
  read_only_mode: false,
  disable_ai: false,
  disable_exports: false,
  disable_bulk_imports: false,
  disable_new_cbt_sessions: false,
  disable_realtime: false,
  disable_notifications: false,
  disable_payments: false,
};

/**
 * Checks whether a feature flag is enabled.
 * Uses environment variable overrides first, then database, falling back safely.
 */
export async function isSystemFeatureEnabled(
  flagKey: string,
  schoolId?: string | null
): Promise<boolean> {
  // Check environment variables first (immutable per instance)
  const envVal = process.env[`FEATURE_FLAG_${flagKey.toUpperCase()}`];
  if (envVal !== undefined) {
    return envVal === 'true' || envVal === '1';
  }

  try {
    const conditions = [eq(systemFeatureFlags.key, flagKey)];
    if (schoolId) {
      conditions.push(and(eq(systemFeatureFlags.key, flagKey), eq(systemFeatureFlags.schoolId, schoolId)) as any);
    }

    const records = await db
      .select()
      .from(systemFeatureFlags)
      .where(or(...conditions))
      .limit(2);

    if (records.length === 0) {
      return SAFE_FLAG_DEFAULTS[flagKey] ?? true;
    }

    // If school-scoped flag exists, prioritize it
    const schoolScoped = records.find((r) => r.schoolId === schoolId);
    if (schoolScoped) {
      return schoolScoped.enabled;
    }

    return records[0].enabled;
  } catch (error) {
    console.warn(`Failed reading system feature flag '${flagKey}', applying safe default:`, error);
    return SAFE_FLAG_DEFAULTS[flagKey] ?? false;
  }
}

/**
 * Updates a system feature flag in the database.
 */
export async function setSystemFeatureFlag(
  key: string,
  enabled: boolean,
  options: {
    scope?: 'global' | 'school' | 'emergency';
    schoolId?: string | null;
    description?: string;
    updatedBy?: string;
  } = {}
) {
  await db
    .insert(systemFeatureFlags)
    .values({
      key,
      enabled,
      scope: options.scope || 'global',
      schoolId: options.schoolId || null,
      description: options.description,
      updatedBy: options.updatedBy,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: systemFeatureFlags.key,
      set: {
        enabled,
        scope: options.scope || 'global',
        schoolId: options.schoolId || null,
        description: options.description,
        updatedBy: options.updatedBy,
        updatedAt: new Date(),
      },
    });
}
