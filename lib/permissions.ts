export interface AppUserPermissions {
  role?: string | null
  admin_level?: string | null
  adminLevel?: string | null
  department?: string | null
}

export function canViewPayments(user?: AppUserPermissions | null): boolean {
  if (!user) return false
  const level = user.admin_level || user.adminLevel
  return user.role === 'SUPER_ADMIN' || level === 'PRIMARY_ADMIN' || user.role === 'PRIMARY_ADMIN'
}

export function canEditFeeStructure(user?: AppUserPermissions | null): boolean {
  if (!user) return false
  const level = user.admin_level || user.adminLevel
  return user.role === 'SUPER_ADMIN' || level === 'PRIMARY_ADMIN' || user.role === 'PRIMARY_ADMIN'
}

export function canViewLedger(user?: AppUserPermissions | null): boolean {
  if (!user) return false
  const level = user.admin_level || user.adminLevel
  return user.role === 'SUPER_ADMIN' || level === 'PRIMARY_ADMIN' || user.role === 'PRIMARY_ADMIN'
}

export function canManageDepartment(user?: AppUserPermissions | null, department?: string | null): boolean {
  if (!user) return false
  const level = user.admin_level || user.adminLevel
  if (user.role === 'SUPER_ADMIN' || level === 'PRIMARY_ADMIN' || user.role === 'PRIMARY_ADMIN') return true
  if (level && level.startsWith('HOD_') && department && user.department === department) return true
  return false
}
