import { randomInt } from 'node:crypto'

const PASSWORD_PREFIX = 'ELlearn@'
const PASSWORD_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export function generateTemporaryPassword(usedCodes: Set<string> = new Set()) {
  if (usedCodes.size >= 720) throw new Error('Temporary password code capacity was exceeded for this registration batch.')

  let code: string
  do {
    const digits = new Set<string>()
    while (digits.size < 3) digits.add(String(randomInt(0, 10)))
    code = [...digits].join('')
  } while (usedCodes.has(code))

  usedCodes.add(code)
  const suffix = Array.from({ length: 10 }, () => PASSWORD_ALPHABET[randomInt(0, PASSWORD_ALPHABET.length)]).join('')
  return `${PASSWORD_PREFIX}${code}-${suffix}`
}
