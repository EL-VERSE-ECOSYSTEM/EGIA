'use server'

import { auth } from '@/lib/auth'

export type SimulatedQuestion = {
  id: string
  type: 'MCQ_Single' | 'MCQ_Multiple' | 'FITB' | 'TrueFalse' | 'Numeric' | 'ShortAnswer'
  question: string
  options?: string[]
  answer: string | string[]
  explanation?: string
  confidence: number
}

/**
 * Simulates the extraction of questions from a PDF/Image using PaddleOCR + LLM logic.
 * In a real production environment, this would call an external microservice or a worker queue.
 */
export async function simulateAIParsing(fileData: string): Promise<SimulatedQuestion[]> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  // Artificial delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Simulate Mixed Question Detection (MCQ + FITB)
  const simulatedQuestions: SimulatedQuestion[] = [
    {
      id: 'sim-1',
      type: 'MCQ_Single',
      question: 'What is the primary capital of Nigeria?',
      options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'],
      answer: 'Abuja',
      explanation: 'Abuja replaced Lagos as the capital in 1991.',
      confidence: 0.98
    },
    {
      id: 'sim-2',
      type: 'FITB',
      question: 'The first Prime Minister of Nigeria was ________ Tafawa Balewa.',
      answer: 'Abubakar',
      explanation: 'Sir Abubakar Tafawa Balewa served as the only Prime Minister of Nigeria.',
      confidence: 0.92
    },
    {
      id: 'sim-3',
      type: 'MCQ_Multiple',
      highlight: 'Select all that apply',
      question: 'Which of the following are major rivers in Nigeria?',
      options: ['River Niger', 'River Benue', 'River Nile', 'River Congo'],
      answer: ['River Niger', 'River Benue'],
      confidence: 0.89
    },
    {
      id: 'sim-4',
      type: 'TrueFalse',
      question: 'Nigeria gained independence in 1960.',
      answer: 'True',
      confidence: 1.0
    },
    {
      id: 'sim-5',
      type: 'FITB',
      question: 'The currency used in Nigeria is the ________.',
      answer: 'Naira',
      confidence: 0.95
    }
  ]

  return simulatedQuestions
}
