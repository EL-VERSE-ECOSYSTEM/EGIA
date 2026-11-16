export const SCHOOL_REGISTRATION_BASE_FEE_NGN = 2_000
export const SCHOOL_REGISTRATION_PROCESSING_FEE_NGN = 161.25

export function calculateSchoolRegistrationTotal(studentCount: number) {
  if (!Number.isInteger(studentCount) || studentCount < 1 || studentCount > 100) {
    throw new Error('Student registration count must be between 1 and 100.')
  }
  return Number((studentCount * (SCHOOL_REGISTRATION_BASE_FEE_NGN + SCHOOL_REGISTRATION_PROCESSING_FEE_NGN)).toFixed(2))
}
