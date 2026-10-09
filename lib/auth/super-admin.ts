import 'server-only'

const SUPER_ADMIN_EMAIL = 'ixoralyon013@gmail.com'

export function isConfiguredSuperAdminEmail(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL
}
