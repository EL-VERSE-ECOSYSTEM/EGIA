'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Phone, X, ExternalLink, HelpCircle, Send, CheckCircle2, Loader2, Sparkles, CornerDownLeft } from 'lucide-react'
import { subscribeToTable, unsubscribeFromTable } from '@/utils/supabase/client'
import { createSupportTicket } from '@/app/actions/support'
import { toast } from 'sonner'

export function FloatingSupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'HOME' | 'SUBMIT' | 'MY_TICKETS'>('HOME')

  // Support ticket form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('TECHNICAL')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedTicket, setSubmittedTicket] = useState<any | null>(null)

  // Close modal when pressing Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Real-time updates subscription
  useEffect(() => {
    if (!isOpen) return

    const ticketChannel = subscribeToTable('support_ticket', {
      callback: () => {
        toast.info('Support ticket status updated in real time!')
      },
    })

    const repliesChannel = subscribeToTable('support_ticket_replies', {
      callback: () => {
        toast.success('Super Admin sent a real-time support response!')
      },
    })

    return () => {
      unsubscribeFromTable(ticketChannel)
      unsubscribeFromTable(repliesChannel)
    }
  }, [isOpen])

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Please enter a title and description for your support request.')
      return
    }

    setSubmitting(true)
    try {
      const res = await createSupportTicket({
        title,
        category,
        priority: 'HIGH',
        description,
      })

      if (res && res.id) {
        setSubmittedTicket(res)
        toast.success('Support request submitted! Super Admin will respond in real time.')
        setTitle('')
        setDescription('')
        setMode('MY_TICKETS')
      } else {
        toast.error('Could not submit support request. Please try again.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit support request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-6 z-[999] font-sans">
      {isOpen && (
        <div
          id="support-widget-panel"
          role="dialog"
          aria-label="EL LEARNERS Support Panel"
          aria-modal="true"
          className="mb-4 bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl text-white w-80 sm:w-96 animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none motion-reduce:transition-none space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <HelpCircle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="font-black text-sm text-white block leading-tight">Live Support Gateway</span>
                <span className="text-[10px] text-slate-400 font-bold">Real-time Supabase Database Sync</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close support panel"
              className="text-slate-400 hover:text-white transition p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 motion-reduce:transition-none"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMode('HOME')}
              aria-pressed={mode === 'HOME'}
              className={`py-1.5 rounded-xl transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                mode === 'HOME' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp & Quick
            </button>
            <button
              type="button"
              onClick={() => setMode('SUBMIT')}
              aria-pressed={mode === 'SUBMIT'}
              className={`py-1.5 rounded-xl transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                mode === 'SUBMIT' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Submit Support Ticket
            </button>
          </div>

          {/* HOME MODE */}
          {mode === 'HOME' && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Need immediate assistance with registration, payments, or portal access?
              </p>

              {/* Direct WhatsApp Connect */}
              <a
                href="https://wa.me/2348061908715"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact WhatsApp Support at +2348061908715 (opens in a new tab)"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-between shadow-lg shadow-emerald-600/20 transition motion-reduce:transition-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-200" aria-hidden="true" />
                  <span>WhatsApp Support: +2348061908715</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition motion-reduce:transition-none" aria-hidden="true" />
              </a>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Real-Time Super Admin Quick Reply</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Submit a ticket inside this widget. Our Super Admin team responds instantly via Supabase Database sync with auto-acknowledgments and updates.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('SUBMIT')}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Create Live Support Ticket</span>
                </button>
              </div>
            </div>
          )}

          {/* SUBMIT MODE */}
          {mode === 'SUBMIT' && (
            <form onSubmit={handleSubmitSupport} className="space-y-3 pt-1">
              <div>
                <label htmlFor="support-subject" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Issue Title <span aria-hidden="true" className="text-emerald-400">*</span>
                </label>
                <input
                  id="support-subject"
                  type="text"
                  required
                  aria-required="true"
                  placeholder="e.g. Payment receipt or portal access error"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="support-category" className="block text-[10px] font-black uppercase text-slate-400 mb-1">Category</label>
                <select
                  id="support-category"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="BILLING">School Registration / Payment</option>
                  <option value="ACCOUNT">Account Access / Password</option>
                  <option value="GENERAL">General Support</option>
                </select>
              </div>

              <div>
                <label htmlFor="support-message" className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                  Detailed Message <span aria-hidden="true" className="text-emerald-400">*</span>
                </label>
                <textarea
                  id="support-message"
                  required
                  aria-required="true"
                  rows={3}
                  placeholder="Describe your request in detail..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    <span>Submitting Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Send Support Ticket</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MY TICKETS / RECENT ACKNOWLEDGMENT */}
          {mode === 'MY_TICKETS' && submittedTicket && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span className="font-bold text-xs">Ticket Created Successfully</span>
                </div>
                <p className="text-[11px] font-mono text-white">ID: {submittedTicket.ticketNumber || submittedTicket.id}</p>
                <p className="text-xs text-slate-300">{submittedTicket.title}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Real-time Response Status</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <p className="font-bold text-white flex items-center gap-1">
                    <CornerDownLeft className="w-3 h-3 text-emerald-400" aria-hidden="true" /> Super Admin Quick Response:
                  </p>
                  <p className="italic text-slate-400">
                    &quot;We have taken note of the support submitted, we&apos;ll get back to you shortly.&quot;
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMode('HOME')}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition motion-reduce:transition-none"
              >
                Back to Support Options
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="relative group">
        <span className="absolute -top-1 -right-1 flex h-4 w-4 z-20" aria-hidden="true">
          <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close live support panel" : "Open live support panel"}
          aria-expanded={isOpen}
          aria-controls="support-widget-panel"
          className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-slate-950 font-black flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.35)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.5)] transition-all duration-300 motion-reduce:transition-none hover:scale-110 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 border border-emerald-300/30 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {isOpen ? (
            <X className="w-7 h-7 text-slate-950" aria-hidden="true" />
          ) : (
            <MessageSquare className="w-7 h-7 text-slate-950 fill-current" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  )
}
