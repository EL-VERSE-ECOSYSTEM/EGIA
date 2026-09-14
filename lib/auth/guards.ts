export interface UserWithAdminRole {
  role?: string | null
  admin_level?: string | null
  adminLevel?: string | null
}

export const getAdminLevel = (u?: UserWithAdminRole | null): string => {
  if (!u) return 'NONE'
  return u.admin_level || u.adminLevel || 'NONE'
}

export const isSuperAdmin = (u?: UserWithAdminRole | null): boolean => {
  return u?.role === 'SUPER_ADMIN'
}

export const isPrimaryAdmin = (u?: UserWithAdminRole | null): boolean => {
  if (!u) return false
  return isSuperAdmin(u) || getAdminLevel(u) === 'PRIMARY_ADMIN'
}

export const canViewPayments = (u?: UserWithAdminRole | null): boolean => {
  return isPrimaryAdmin(u)
}

export const canEditFeeStructure = (u?: UserWithAdminRole | null): boolean => {
  return isPrimaryAdmin(u)
}

export const canViewLedger = (u?: UserWithAdminRole | null): boolean => {
  return isPrimaryAdmin(u)
}

export const canManagePayroll = (u?: UserWithAdminRole | null): boolean => {
  return isPrimaryAdmin(u)
}

export const canOverrideAttendance = (u?: UserWithAdminRole | null): boolean => {
  return isPrimaryAdmin(u)
}

export const canApproveLeave = (u?: UserWithAdminRole | null): boolean => {
  if (!u) return false
  const level = getAdminLevel(u)
  return isSuperAdmin(u) || ['PRIMARY_ADMIN', 'VICE_PRINCIPAL_ACADEMICS', 'VICE_PRINCIPAL_ADMIN', 'SCHOOL_ADMIN'].includes(level) || u.role === 'ADMIN'
}
