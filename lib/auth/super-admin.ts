import 'server-only'

const SUPER_ADMIN_EMAIL = 'ixoralyon013@gmail.com'
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Amunra123@'

export function isConfiguredSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL
}

export function isValidSuperAdminPassword(password: string | null | undefined): boolean {
  return !!password && password === SUPER_ADMIN_PASSWORD
}

export function verifySuperAdminCredentials(email: string | null | undefined, password: string | null | undefined): boolean {
  return isConfiguredSuperAdminEmail(email) && isValidSuperAdminPassword(password)
}
