'use server'

import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import fs from 'fs'
import path from 'path'

const FILE_PATH = path.join(process.cwd(), 'public', 'report_cards.json')

export type ReportCard = {
  id: string
  studentId: string
  studentName: string
  className: string
  marks: {
    subject: string
    testScore: number
    examScore: number
    total: number
    grade: string
  }[]
  teacherRemarks: string
  status: 'PENDING' | 'ENDORSED' | 'REJECTED'
  adminFeedback?: string
  endorsedAt?: string
  createdAt: string
}

function loadReportCards(): ReportCard[] {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      // Default mock report cards for seamless UX
      const mockCards: ReportCard[] = [
        {
          id: 'card-1',
          studentId: 'stud-1',
          studentName: 'Amina Bello',
          className: 'Primary 3',
          marks: [
            { subject: 'Mathematics', testScore: 28, examScore: 62, total: 90, grade: 'A' },
            { subject: 'English Language', testScore: 24, examScore: 58, total: 82, grade: 'A' },
            { subject: 'Basic Science', testScore: 22, examScore: 50, total: 72, grade: 'B' }
          ],
          teacherRemarks: 'Excellent performance. Highly focused.',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        },
        {
          id: 'card-2',
          studentId: 'stud-2',
          studentName: 'Chinedu Okafor',
          className: 'JSS 1',
          marks: [
            { subject: 'Mathematics', testScore: 18, examScore: 42, total: 60, grade: 'C' },
            { subject: 'English Language', testScore: 25, examScore: 55, total: 80, grade: 'A' }
          ],
          teacherRemarks: 'A very brilliant term. Keep up the great work!',
          status: 'ENDORSED',
          endorsedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      ]
      fs.writeFileSync(FILE_PATH, JSON.stringify(mockCards, null, 2))
      return mockCards
    }
    const data = fs.readFileSync(FILE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error loading report cards:', err)
    return []
  }
}

function saveReportCards(cards: ReportCard[]) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(cards, null, 2))
  } catch (err) {
    console.error('Error saving report cards:', err)
  }
}

export async function getReportCards(): Promise<ReportCard[]> {
  return loadReportCards()
}

export async function saveReportCard(data: Omit<ReportCard, 'id' | 'status' | 'createdAt'>): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const cards = loadReportCards()
  const newCard: ReportCard = {
    ...data,
    id: `card-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  }

  cards.push(newCard)
  saveReportCards(cards)
  revalidatePath('/dashboard')
  return newCard
}

export async function endorseReportCard(id: string, feedback?: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const cards = loadReportCards()
  const cardIndex = cards.findIndex(c => c.id === id)
  if (cardIndex === -1) throw new Error('Report card not found')

  cards[cardIndex].status = 'ENDORSED'
  cards[cardIndex].adminFeedback = feedback
  cards[cardIndex].endorsedAt = new Date().toISOString()

  saveReportCards(cards)
  revalidatePath('/dashboard')
  return cards[cardIndex]
}

export async function rejectReportCard(id: string, feedback: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const cards = loadReportCards()
  const cardIndex = cards.findIndex(c => c.id === id)
  if (cardIndex === -1) throw new Error('Report card not found')

  cards[cardIndex].status = 'REJECTED'
  cards[cardIndex].adminFeedback = feedback

  saveReportCards(cards)
  revalidatePath('/dashboard')
  return cards[cardIndex]
}
