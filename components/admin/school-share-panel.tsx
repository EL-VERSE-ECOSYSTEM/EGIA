'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from '@/components/ui/qr-code'
import { Button } from '@/components/ui/button'

export function SchoolSharePanel({ schoolName, schoolCode }: { schoolName: string; schoolCode: string }) {
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const url = new URL('/auth/signup/student-registration', window.location.origin)
    url.searchParams.set('schoolCode', schoolCode)
    setShareUrl(url.toString())
  }, [schoolCode])

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not access clipboard. Please copy it manually.')
    }
  }

  const share = async () => {
    if (!shareUrl) return
    if (navigator.share) {
      try {
        await navigator.share({ title: `${schoolName} registration`, text: `Join ${schoolName} in EL Learners App. School code: ${schoolCode}`, url: shareUrl })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') toast.error('Could not open the share menu.')
      }
      return
    }
    await copy(shareUrl, 'Registration link')
  }

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-lg sm:flex-row sm:items-center sm:p-7">
      <div className="flex-1 space-y-3">
        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Share your school</p>
        <h2 className="text-xl font-black text-slate-900">Invite families to {schoolName}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">Scan the QR code to open student registration with your school code filled in, or share the app link and code separately.</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-slate-100 px-4 py-2 font-mono text-lg font-black tracking-wider text-slate-900">{schoolCode}</span>
          <Button type="button" variant="outline" onClick={() => void copy(schoolCode, 'School code')} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy code
          </Button>
          <Button type="button" onClick={() => void share()} disabled={!shareUrl} className="gap-2 bg-blue-700 text-white hover:bg-blue-800">
            <Share2 className="h-4 w-4" /> Share app link
          </Button>
        </div>
      </div>
      {shareUrl && <div className="self-center text-center">
        <QRCodeSVG value={shareUrl} size={156} />
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Scan to register</p>
      </div>}
    </section>
  )
}
