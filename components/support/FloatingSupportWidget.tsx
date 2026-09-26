'use client'

import React, { useState, useEffect } from 'react'
import { HelpCircle, Mail, MessageSquare, X, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function formatSupportToggleAriaLabel(isOpen: boolean): string {
  return isOpen ? "Close support panel" : "Need assistance? Open support panel"
}

export function FloatingSupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message) return

    setSent(true)
    setTimeout(() => {
      setSent(false)
      setIsOpen(false)
      setSubject('')
      setMessage('')
    }, 2000)
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={formatSupportToggleAriaLabel(false)}
          aria-expanded={false}
          aria-controls="floating-support-panel"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 motion-reduce:hover:scale-100 motion-reduce:active:scale-100 motion-reduce:transition-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          title="Need Assistance? Contact Support"
        >
          <HelpCircle aria-hidden="true" className="w-7 h-7 text-white group-hover:rotate-12 transition-transform motion-reduce:transition-none" />
        </button>
      )}

      {/* Support Modal Window */}
      {isOpen && (
        <div
          id="floating-support-panel"
          role="dialog"
          aria-label="EL LEARNERS Support Panel"
          aria-modal="true"
          className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl w-80 sm:w-96 text-white space-y-5 animate-in slide-in-from-bottom-5 duration-300 motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-blue-400 font-black text-sm">
              <MessageSquare aria-hidden="true" className="w-4 h-4" />
              <span>EL LEARNERS Support</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={formatSupportToggleAriaLabel(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <X aria-hidden="true" className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-blue-300">Official App Support Email:</p>
            <p className="font-mono text-white text-[11px] select-all flex items-center gap-1.5">
              <Mail aria-hidden="true" className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>elcoderssoftwares12@gmail.com</span>
            </p>
          </div>

          {sent ? (
            <div className="py-6 text-center space-y-2 text-emerald-400" role="status" aria-live="polite">
              <CheckCircle2 aria-hidden="true" className="w-10 h-10 mx-auto" />
              <p className="font-black text-sm">Support Inquiry Dispatched!</p>
              <p className="text-[11px] text-slate-400">Our engineering team will respond to your email.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="support-subject" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Inquiry Subject</Label>
                <Input
                  id="support-subject"
                  placeholder="e.g. Account setup or CBT query"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-white h-10 text-xs rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="support-message" className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Message <span aria-hidden="true" className="text-red-400">*</span>
                </Label>
                <textarea
                  id="support-message"
                  required
                  aria-required="true"
                  rows={3}
                  placeholder="Describe your issue or feedback..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black h-11 rounded-xl text-xs flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <span>SEND SUPPORT MESSAGE</span>
                <Send aria-hidden="true" className="w-3.5 h-3.5" />
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
