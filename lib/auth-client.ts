import { createNeonAuth } from '@neondatabase/neon-js'

export const authClient = createNeonAuth({
  authUrl: process.env.NEXT_PUBLIC_NEON_AUTH_URL!,
})
