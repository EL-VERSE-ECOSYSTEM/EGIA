import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const role = (user.user_metadata?.role || '').toUpperCase()
    if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to upload lesson note PDFs.' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF document.' }, { status: 400 })
    }

    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json({ error: 'PDF file size exceeds maximum limit of 10MB.' }, { status: 400 })
    }

    const fileName = `${Date.now()}-${randomUUID()}.pdf`
    const filePath = `pdfs/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lesson-notes')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError.message)
      return NextResponse.json(
        { error: `Failed to store PDF file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage.from('lesson-notes').getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      fileUrl: urlData.publicUrl,
      storagePath: filePath,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    })
  } catch (error: any) {
    console.error('Error in PDF upload endpoint:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload PDF file.' }, { status: 500 })
  }
}
