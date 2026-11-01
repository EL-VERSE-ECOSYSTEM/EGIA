import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export type EGIAToggle =
  | 'maintenance_mode'
  | 'read_only_mode'
  | 'disable_ai'
  | 'disable_exports'
  | 'disable_bulk_imports'
  | 'disable_realtime_presence'
  | 'disable_new_cbt_sessions'
  | 'disable_external_integrations'

export async function isFeatureDisabled(key: EGIAToggle): Promise<boolean> {
  const result = await db.execute(sql`
    select enabled from public.egia_feature_flags where key = ${key} limit 1
  `)
  const row = Array.isArray(result) ? result[0] as { enabled?: boolean } | undefined : undefined
  return row ? row.enabled === false : false
}

export async function setFeatureFlag(key: EGIAToggle, enabled: boolean, actorId?: string) {
  await db.execute(sql`
    insert into public.egia_feature_flags(key, enabled, updated_by, updated_at)
    values (${key}, ${enabled}, ${actorId ?? null}, now())
    on conflict (key) do update set enabled = excluded.enabled,
      updated_by = excluded.updated_by, updated_at = now()
  `)
}
