import { createNeonAuth } from '@neondatabase/neon-js'

if (!process.env.NEXT_PUBLIC_NEON_AUTH_URL) {
  throw new Error('NEXT_PUBLIC_NEON_AUTH_URL is not set')
}

export const auth = createNeonAuth({
  authUrl: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
})
