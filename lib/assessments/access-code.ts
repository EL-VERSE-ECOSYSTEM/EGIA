import { randomInt } from 'crypto'

const ACCESS_CODE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const ACCESS_CODE_LENGTH = 6

export function generateExamAccessCode() {
  return Array.from({ length: ACCESS_CODE_LENGTH }, () =>
    ACCESS_CODE_ALPHABET[randomInt(ACCESS_CODE_ALPHABET.length)],
  ).join('')
}

export function isValidExamAccessCode(value: string) {
  return /^[A-Z0-9]{6}$/i.test(value)
}
