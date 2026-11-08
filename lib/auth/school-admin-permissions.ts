export type SchoolAdminAction = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'grade'

const FINANCIAL_RESOURCES = new Set(['payment', 'transaction', 'finance', 'ledger', 'payroll'])
const HOD_RESOURCES = new Set([
  'assessment', 'result', 'student', 'teacher', 'parent', 'message', 'dispute', 'class',
])
const HOD_RESTRICTED_OPERATIONS = new Set([
  'expel', 'expulsion', 'promote', 'promotion', 'suspend', 'suspension', 'teacher_promotion',
])

export function canSchoolAdminAccess(
  adminLevel: string | null | undefined,
  action: SchoolAdminAction,
  resource: string,
  operation?: string | null,
): boolean {
  const level = (adminLevel || '').toUpperCase()
  const normalizedResource = resource.toLowerCase()
  const normalizedOperation = (operation || '').toLowerCase().replace(/[\s-]+/g, '_')

  if (level === 'PRIMARY_ADMIN') return true
  if (FINANCIAL_RESOURCES.has(normalizedResource)) return false

  if (level.startsWith('VICE_PRINCIPAL')) return true
  if (!level.startsWith('HOD_')) return false
  if (!HOD_RESOURCES.has(normalizedResource)) return false
  if (HOD_RESTRICTED_OPERATIONS.has(normalizedOperation)) return false
  if (action === 'publish' && normalizedResource === 'student') return false

  return true
}