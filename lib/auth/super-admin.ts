const SUPER_ADMIN_EMAIL = 'ixoralyon013@gmail.com'
export const SUPER_ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001'
const SUPER_ADMIN_PASSWORD = 'Amunra123@'

export function isConfiguredSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL
}

export function isValidSuperAdminPassword(password: string | null | undefined): boolean {
  return !!password && password.trim() === SUPER_ADMIN_PASSWORD
}

export function verifySuperAdminCredentials(email: string | null | undefined, password: string | null | undefined): boolean {
  return isConfiguredSuperAdminEmail(email) && isValidSuperAdminPassword(password)
}
