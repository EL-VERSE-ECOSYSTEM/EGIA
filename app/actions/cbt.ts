'use server'

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createAssessment(data: {
  title: string
  type: string
  subjectId: string
  termId: string
  questions: any[]
  totalMarks: number
  duration?: number
}) {
  const session = await auth()
  if (!session || session.user.role !== "TEACHER") throw new Error("Unauthorized")

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id }
  })

  if (!teacher) throw new Error("Teacher profile not found")

  const assessment = await prisma.assessment.create({
    data: {
      ...data,
      teacherId: teacher.id,
      status: "PUBLISHED"
    }
  })

  revalidatePath("/dashboard/teacher/assessments")
  return assessment
}

export async function submitCBT(assessmentId: string, answers: Record<string, string>) {
  const session = await auth()
  if (!session || session.user.role !== "STUDENT") throw new Error("Unauthorized")

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id }
  })

  if (!student) throw new Error("Student profile not found")

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId }
  })

  if (!assessment) throw new Error("Assessment not found")

  // Auto-grading logic
  const questions = assessment.questions as any[]
  let totalScore = 0

  questions.forEach((q: any, index: number) => {
    if (answers[index] === q.correctAnswer) {
      totalScore += q.marks
    }
  })

  const percentage = (totalScore / assessment.totalMarks) * 100
  let grade = "F"
  if (percentage >= 70) grade = "A"
  else if (percentage >= 60) grade = "B"
  else if (percentage >= 50) grade = "C"
  else if (percentage >= 45) grade = "D"
  else if (percentage >= 40) grade = "E"

  const result = await prisma.result.create({
    data: {
      assessmentId,
      studentId: student.id,
      score: totalScore,
      percentage,
      grade
    }
  })

  revalidatePath("/dashboard/student/results")
  return result
}
