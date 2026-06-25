'use client'

import { createClient } from '@/utils/supabase/client'

export async function signUpAsParent(formData: any) {
  const supabase = createClient()
  const { firstName, lastName, email, phone, password } = formData

  // 1. Sign up to Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        role: 'PARENT'
      }
    }
  })

  if (authError) throw authError
  if (!authData.user) throw new Error('User creation failed')

  // 2. Profile data will be handled via a server action or triggered by a webhook (or here for simplicity if allowed by environment)
  // But wait, server actions are better for DB writes.
  return authData.user.id
}
