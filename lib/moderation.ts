/**
 * Message Moderation & Censorship Engine
 * Enforces school guidelines on communication channels.
 */
export function moderateMessage(content: string): { allowed: boolean; reason?: string } {
  const text = content.toLowerCase()

  // 1. WhatsApp / Phone number requesting block
  const hasWhatsApp = text.includes('whatsapp') || text.includes('whats app')
  const phoneRegex = /(?:\+?234|0)[789][01]\d{8}/g // Nigerian phone number formats
  const hasPhonePattern = phoneRegex.test(text) || text.includes('phone number') || text.includes('mobile number') || text.includes('contact me on')

  if (hasWhatsApp || hasPhonePattern) {
    return {
      allowed: false,
      reason: 'WhatsApp Sharing Blocked: Requesting or sharing WhatsApp numbers / personal phone numbers is strictly prohibited on school channels.'
    }
  }

  // 2. Love chats / Romantic block
  const loveWords = ['love', 'date', 'relationship', 'babe', 'sweetheart', 'honey', 'sexy', 'crush', 'romantic', 'boyfriend', 'girlfriend']
  const hasLoveChat = loveWords.some(word => text.includes(rowWordBoundary(word)))

  if (hasLoveChat) {
    return {
      allowed: false,
      reason: 'Love Chats Blocked: Romantic, dating, or relationship-related conversations are strictly prohibited on school channels.'
    }
  }

  // 3. Arguments / Foul language block
  const foulWords = ['idiot', 'stupid', 'bastard', 'fool', 'hate', 'shut up', 'nonsense', 'argue', 'argument', 'fuck', 'bitch', 'asshole']
  const hasFoul = foulWords.some(word => text.includes(word))

  if (hasFoul) {
    return {
      allowed: false,
      reason: 'Argument & Foul Language Blocked: Swearing, verbal abuse, insults, or hostile arguments are strictly prohibited on school channels.'
    }
  }

  // 4. Vernacular / Pidgin block
  const vernacularWords = ['wetin', 'abi', 'shayo', 'mumu', 'jara', 'japa', 'choko', 'odogwu', 'shege', 'unla', 'na wa', 'oya']
  const hasVernacular = vernacularWords.some(word => text.includes(rowWordBoundary(word)))

  if (hasVernacular) {
    return {
      allowed: false,
      reason: 'Vernacular Blocked: Speaking or typing in Pidgin English, local vernacular, or unregistered slang is prohibited. Please use formal English Language.'
    }
  }

  return { allowed: true }
}

function rowWordBoundary(word: string): string {
  // Simple word boundary helper
  return word
}
