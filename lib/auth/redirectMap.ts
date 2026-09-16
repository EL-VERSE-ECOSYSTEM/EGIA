export type RoleType = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT'

export interface IdentityRouteInfo {
  role: RoleType
  adminLevel?: string | null
  department?: string | null
}

export function getRedirectUrlForIdentity(identity: IdentityRouteInfo): string {
  const role = identity.role.toUpperCase() as RoleType

  switch (role) {
    case 'SUPER_ADMIN':
      return '/dashboard/super-admin'

    case 'SCHOOL_ADMIN': {
      const level = (identity.adminLevel || '').toUpperCase()
      const dept = (identity.department || '').toLowerCase()

      if (level.includes('HOD') || dept) {
        if (dept.includes('science') || level.includes('SCIENCE')) {
          return '/dashboard/admin/hod/science'
        }
        if (dept.includes('art') || level.includes('ARTS')) {
          return '/dashboard/admin/hod/arts'
        }
        if (dept.includes('commercial') || level.includes('COMMERCIAL')) {
          return '/dashboard/admin/hod/commercial'
        }
      }
      return '/dashboard/admin'
    }

    case 'TEACHER':
      return '/dashboard/teacher'

    case 'PARENT':
      return '/dashboard/parent'

    case 'STUDENT':
      return '/dashboard/student'

    default:
      return '/dashboard'
  }
}
