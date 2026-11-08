'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Bot, LoaderCircle, Save } from 'lucide-react'

export default function LearnAiSettingsPage() {
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/learn-ai/settings', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load school guidance.')
        if (active) setInstructions(result.instructions)
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Could not load school guidance.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/learn-ai/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructions }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save school guidance.')
      setMessage('School guidance saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save school guidance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <main className="mx-auto min-h-screen w-full max-w-4xl space-y-6 p-4 sm:p-8">
        <header className="flex items-start gap-3 border-b border-slate-200 pb-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-800">
            <Bot className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Learn AI school guidance</h1>
            <p className="mt-1 text-sm text-slate-600">Set subject, curriculum, and teaching guidance for your school&apos;s AI assistant.</p>
          </div>
        </header>

        <section className="space-y-4">
          <div>
            <label htmlFor="learn-ai-school-instructions" className="block text-sm font-semibold text-slate-900">School guidance</label>
            <p className="mt-1 text-xs text-slate-600">This guidance is included with Learn AI requests for users linked to your school. Do not include private student details.</p>
          </div>
          <textarea
            id="learn-ai-school-instructions"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={4000}
            rows={12}
            disabled={loading || saving}
            placeholder="For example: Use the Nigerian curriculum, show workings for mathematics, and explain concepts using age-appropriate examples."
            className="min-h-56 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 disabled:bg-slate-100"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">{instructions.length}/4,000 characters</p>
            <button
              type="button"
              onClick={() => void save()}
              disabled={loading || saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              Save guidance
            </button>
          </div>
          {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
        </section>
      </main>
    </DashboardLayout>
  )
}