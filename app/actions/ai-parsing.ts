'use server'

import { auth } from '@/lib/auth'

export type ParsedQuestion = {
  id: string
  type: 'MCQ_Single' | 'MCQ_Multiple' | 'FITB' | 'TrueFalse' | 'Numeric' | 'ShortAnswer'
  question: string
  options?: string[]
  answer: string | string[]
  explanation?: string
  confidence: number
}

export type SimulatedQuestion = ParsedQuestion

/**
 * Kept as a compatibility boundary for the PDF screen. It intentionally never
 * invents questions: production parsing must use the supported import endpoint
 * or a configured extraction provider.
 */
export async function simulateAIParsing(fileData: string): Promise<ParsedQuestion[]> {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') throw new Error('Unauthorized')
  if (!fileData) throw new Error('Upload a PDF or image before parsing.')
  throw new Error('AI question extraction is not configured. Use PDF/CSV import until an extraction provider is configured.')
}
