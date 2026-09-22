'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export function ContactForm() {
  return (
    <Card className="bg-slate-50 border-none rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 shadow-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          alert('Thank you for reaching out! Our support team will get back to you shortly.')
        }}
        className="space-y-6 sm:space-y-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
              First Name
            </label>
            <Input
              id="firstName"
              required
              placeholder="Enter first name"
              className="h-12 rounded-xl bg-white border border-slate-200 px-4 font-bold text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">
              Last Name
            </label>
            <Input
              id="lastName"
              required
              placeholder="Enter last name"
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
            className="rounded-xl bg-white border border-slate-200 p-4 font-bold text-sm"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg"
        >
          Send Message
        </Button>
      </form>
    </Card>
  )
}
