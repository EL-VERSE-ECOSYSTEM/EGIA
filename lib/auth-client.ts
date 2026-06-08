import { createClient } from '@neondatabase/neon-js'

export const authClient = createClient({
  auth: {
    url: process.env.NEXT_PUBLIC_NEON_AUTH_URL!,
  },
  dataApi: {
    url: '', // Dummy since we only need auth
  }
})
