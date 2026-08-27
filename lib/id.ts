export function cleanSchoolPrefix(schoolNameOrCode?: string): string {
  if (!schoolNameOrCode) return 'SCHO'
  const trimmed = schoolNameOrCode.trim().toUpperCase()

  // If already a school code like "EGIA-19001", extract "EGIA"
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-')
    if (parts[0].length >= 2) return parts[0]
  }

  // Extract words and build 4-letter prefix from initials
  const words = trimmed.split(/\s+/).filter(w => w.length > 0)
  if (words.length >= 4) {
    return words.slice(0, 4).map(w => w[0]).join('')
  } else if (words.length === 2 || words.length === 3) {
    return words.map(w => w.slice(0, 2)).join('').slice(0, 4)
  }

  const clean = trimmed.replace(/[^A-Z]/g, '')
  return (clean + 'SCHO').slice(0, 4)
}

export function generateAdmissionNumber(classLevel?: string, schoolNameOrCode?: string) {
  const prefix = cleanSchoolPrefix(schoolNameOrCode)
  const normalized = (classLevel || '').toString().replace(/\s+/g, '').toUpperCase()

  const isPupil = /^(PRIMARY[3-6]|P[3-6]|PRIMARY5\/6|P5\/6)$/.test(normalized)
  const isStudent = /^(JSS[123]|SSS[123])$/.test(normalized)

  const random6 = Math.floor(100000 + Math.random() * 900000)

  if (isPupil) {
    return `${prefix}-P-${random6}`
  }

  if (isStudent) {
    return `${prefix}-S-${random6}`
  }

  return `${prefix}-S-${random6}`
}

export function generateStaffId(schoolNameOrCode?: string) {
  const prefix = cleanSchoolPrefix(schoolNameOrCode)
  const random6 = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-ST-${random6}`
}

export function isValidAdmissionNumber(value: string, classLevel?: string, schoolNameOrCode?: string) {
  const prefix = cleanSchoolPrefix(schoolNameOrCode)
  const normalized = value.trim().toUpperCase()
  const className = (classLevel || '').replace(/\s+/g, '').toUpperCase()
  const expectedTag = /^(PRIMARY[3-6]|P[3-6]|PRIMARY5\/6|P5\/6)$/.test(className) ? 'P' : 'S'
  return new RegExp(`^${prefix}-${expectedTag}-\\d{6}$`).test(normalized)
}

export function isValidStaffId(value: string, schoolNameOrCode?: string) {
  const prefix = cleanSchoolPrefix(schoolNameOrCode)
  return new RegExp(`^${prefix}-ST-\\d{6}$`).test(value.trim().toUpperCase())
}
