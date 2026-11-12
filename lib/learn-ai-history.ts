export type LearnAiMessage = { role: 'user' | 'assistant'; content: string }

const HISTORY_TTL_MS = 24 * 60 * 60 * 1000

function historyKey(userId: string) {
  return `learn-ai-history:${userId}`
}

export function loadLearnAiHistory(userId: string): LearnAiMessage[] {
  try {
    const raw = localStorage.getItem(historyKey(userId))
    if (!raw) return []
    const saved = JSON.parse(raw) as { updatedAt?: number; messages?: unknown }
    if (!saved.updatedAt || Date.now() - saved.updatedAt >= HISTORY_TTL_MS) {
      localStorage.removeItem(historyKey(userId))
      return []
    }
    if (!Array.isArray(saved.messages)) return []
    return saved.messages.filter((message): message is LearnAiMessage =>
      Boolean(message && typeof message === 'object' &&
        ((message as LearnAiMessage).role === 'user' || (message as LearnAiMessage).role === 'assistant') &&
        typeof (message as LearnAiMessage).content === 'string')
    ).slice(-10)
  } catch {
    return []
  }
}

export function saveLearnAiHistory(userId: string, messages: LearnAiMessage[]) {
  try {
    if (!messages.length) {
      localStorage.removeItem(historyKey(userId))
      return
    }
    localStorage.setItem(historyKey(userId), JSON.stringify({ updatedAt: Date.now(), messages: messages.slice(-10) }))
  } catch {
    // Chat remains usable if browser storage is unavailable or full.
  }
}
