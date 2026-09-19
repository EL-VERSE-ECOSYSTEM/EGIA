import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const csvContent = `questionText,questionType,optionA,optionB,optionC,optionD,correctAnswer,points,explanation
"What is 2+2?","MCQ","3","4","5","6","4",1,"Basic arithmetic"
"The capital of France is ____.","FITB","","","","","Paris",1,"Capital city"
"Is water liquid at room temperature?","TRUE_FALSE","True","False","","","True",1,"Physical states of matter"`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="assessment_questions_template.csv"',
    },
  })
}
