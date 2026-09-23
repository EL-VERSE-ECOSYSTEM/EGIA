'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createSupportTicket } from '@/app/actions/support'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Send } from 'lucide-react'

export function ContactForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !email || !message) {
      toast.error('Please fill in all required fields.')
      return
    }

    setLoading(true)
    try {
      const title = `Contact Inquiry from ${firstName} ${lastName}`.trim()
      const description = `Name: ${firstName} ${lastName}\nContact Email: ${email}\n\nMessage:\n${message}`

      const res = await createSupportTicket({
        title,
        category: 'GENERAL',
        priority: 'MEDIUM',
        description,
      })

      if (res && res.id) {
        setSubmitted(true)
        toast.success('Your message has been received! Our support team will respond in real time.')
      } else {
        toast.error('Could not send your message. Please try again.')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit contact message.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="bg-slate-900 border-none text-white rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black tracking-tight">Message Received!</h3>
        <p className="text-sm font-medium text-slate-300 max-w-md mx-auto leading-relaxed">
          Thank you for reaching out to EL LEARNERS APP support. Your inquiry is recorded in our real-time database, and our Super Admin team will respond shortly.
        </p>
        <Button
          onClick={() => {
            setSubmitted(false)
            setFirstName('')
            setLastName('')
            setEmail('')
            setMessage('')
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl px-8 py-3 text-xs uppercase"
        >
          Send Another Message
        </Button>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-50 border-none rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
              First Name
            </label>
            <Input
              id="firstName"
              required
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12 rounded-xl bg-white border border-slate-200 px-4 font-bold text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
              Last Name
            </label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 rounded-xl bg-white border border-slate-200 px-4 font-bold text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="contactEmail" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
            Email Address
          </label>
          <Input
            id="contactEmail"
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl bg-white border border-slate-200 px-4 font-bold text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="contactMessage" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
            Message
          </label>
          <Textarea
            id="contactMessage"
            required
            placeholder="How can we help you?"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-xl bg-white border border-slate-200 p-4 font-bold text-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>SENDING MESSAGE...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-emerald-400" />
              <span>SEND MESSAGE</span>
            </>
          )}
        </Button>
      </form>
    </Card>
  )
}
