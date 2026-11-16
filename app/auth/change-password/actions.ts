'use server'

import { cookies } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user as userTable } from '@/lib/db/schema'
import { getSupabaseSecretKey, getSupabaseUrl } from '@/utils/supabase/config'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { z } from 'zod'

const passwordSchema = z.string()
  .min(12, 'Choose a password with at least 12 characters.')
  .max(128, 'Password must be 128 characters or fewer.')

export async function changeTemporaryPasswordAction(passwordInput: string) {
  const parsed = passwordSchema.safeParse(passwordInput)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message || 'Choose a valid password.' }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error: authError } = await supabase.auth.getUser()
  if (authError || !data.user) return { success: false as const, error: 'Sign in with your temporary password to continue.' }

  const profile = await db.query.user.findFirst({
    where: eq(userTable.id, data.user.id),
    columns: { mustChangePassword: true },
  })
  if (!profile?.mustChangePassword || data.user.app_metadata?.must_change_password !== true) {
    return { success: false as const, error: 'This account does not require a temporary password change.' }
  }

  const secretKey = getSupabaseSecretKey()
  if (!secretKey) return { success: false as const, error: 'Password setup is temporarily unavailable.' }

  const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data })
  if (updateError) return { success: false as const, error: updateError.message }

  const admin = createSupabaseAdminClient(getSupabaseUrl(), secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: metadataError } = await admin.auth.admin.updateUserById(data.user.id, {
    app_metadata: { ...data.user.app_metadata, must_change_password: false },
    user_metadata: { ...data.user.user_metadata, must_change_password: false },
  })
  if (metadataError) {
    console.error('Could not clear forced-password-change account metadata.', { userId: data.user.id, error: metadataError })
    return { success: false as const, error: 'Your password was updated, but account activation could not be completed. Please retry.' }
  }

  await db.update(userTable)
    .set({ mustChangePassword: false, updatedAt: new Date() })
    .where(eq(userTable.id, data.user.id))

  const { error: refreshError } = await supabase.auth.refreshSession()
  if (refreshError) {
    console.error('Could not refresh session after temporary password change.', { userId: data.user.id, error: refreshError })
    return { success: false as const, error: 'Password updated. Sign in again with your new password to continue.' }
  }

  return { success: true as const }
}
