export function generateAdmissionNumber(classLevel?: string) {
  const normalized = (classLevel || '').toString().replace(/\s+/g, '').toUpperCase()

  const isPupil = /^(PRIMARY[3-6]|P[3-6])$/.test(normalized)
  const isStudent = /^(JSS[123]|SSS[123])$/.test(normalized)

  if (isPupil) {
    return `EGIA-P-${Math.floor(100000 + Math.random() * 900000)}`
  }

  if (isStudent) {
    return `EGIA-S-${Math.floor(100000 + Math.random() * 900000)}`
  }

  return `EGIA-S-${Math.floor(100000 + Math.random() * 900000)}`
}

export function generateStaffId() {
  return `EGIA-ST-${Math.floor(100000 + Math.random() * 900000)}`
}
