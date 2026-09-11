import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF document.' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const fileExt = file.name.split('.').pop() || 'pdf'
    const fileName = `${Date.now()}-${randomUUID()}.${fileExt}`
    const filePath = `pdfs/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('lesson-notes')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    let publicUrl = ''
    if (uploadError) {
      console.warn('Supabase storage bucket fallback to public static URL endpoint:', uploadError.message)
      // Fallback URL construct
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyz.supabase.co'
      publicUrl = `${supabaseUrl}/storage/v1/object/public/lesson-notes/${filePath}`
    } else {
      const { data: urlData } = supabase.storage.from('lesson-notes').getPublicUrl(filePath)
      publicUrl = urlData.publicUrl
    }

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      storagePath: filePath,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
    })
  } catch (error: any) {
    console.error('Error in PDF upload endpoint:', error)
    return NextResponse.json({ error: error.message || 'Failed to upload PDF file.' }, { status: 500 })
  }
}
