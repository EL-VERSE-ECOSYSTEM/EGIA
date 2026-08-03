import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { PDFToCBTConverter } from '@/lib/pdf-to-cbt/converter'

export async function POST(req: Request) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'PDF conversion is not configured.' }, { status: 503 })
    }
    const formData = await req.formData()
    const file = formData.get('pdf') as File

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const converter = new PDFToCBTConverter(process.env.GEMINI_API_KEY || '')
    const result = await converter.convertPDFToCBT(buffer)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('PDF conversion failed:', error)
    return NextResponse.json({ error: error.message || 'Conversion failed' }, { status: 500 })
  }
}
