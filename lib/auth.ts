import { createClient } from '@neondatabase/neon-js'

if (!process.env.NEXT_PUBLIC_NEON_AUTH_URL) {
  throw new Error('NEXT_PUBLIC_NEON_AUTH_URL is not set')
}

export const auth = createClient({
  auth: {
    url: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
  },
  dataApi: {
    url: '', // Dummy since we only need auth
  }
})
