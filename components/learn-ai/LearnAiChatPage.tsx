'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Bot, LoaderCircle, MessageSquare, RotateCcw, Send, Sparkles } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type Balance = { daily_remaining: number; paid_remaining: number; reset_at: string }

const packages = [
  { id: 'starter', tokens: 35, price: '5,200' },
  { id: 'standard', tokens: 50, price: '6,800' },
  { id: 'plus', tokens: 75, price: '8,000' },
  { id: 'maximum', tokens: 100, price: '10,400' },
] as const

const prompts = [
  'Explain a difficult topic in simple steps.',
  'Help me plan a lesson or study session.',
  'Give me practice questions and explain the answers.',
]

export function LearnAiChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [balance, setBalance] = useState<Balance | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isBuying, setIsBuying] = useState<string | null>(null)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    fetch('/api/learn-ai/chat', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Learn AI is unavailable.')
        if (active) setBalance(result)
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Learn AI is unavailable.')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isSending])

  const sendMessage = async (content = input) => {
    const text = content.trim()
    if (!text || isSending) return

    const nextMessages = [...messages, { role: 'user' as const, content: text }].slice(-10)
    setMessages(nextMessages)
    setInput('')
    setError('')
    setIsSending(true)
    try {
      const response = await fetch('/api/learn-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (typeof result.daily_remaining === 'number' && typeof result.paid_remaining === 'number') {
          setBalance({
            daily_remaining: result.daily_remaining,
            paid_remaining: result.paid_remaining,
            reset_at: result.reset_at || '',
          })
        }
        throw new Error(result.error || 'Learn AI could not answer.')
      }
      setMessages((current) => [...current, { role: 'assistant' as const, content: result.answer }].slice(-10))
      setBalance(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Learn AI could not answer.')
    } finally {
      setIsSending(false)
    }
  }

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendMessage()
  }

  const buyPackage = async (packageId: string) => {
    setIsBuying(packageId)
    setError('')
    try {
      const response = await fetch('/api/learn-ai/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const result = await response.json()
      if (!response.ok || !result.checkoutUrl) throw new Error(result.error || 'Could not start checkout.')
      window.location.assign(result.checkoutUrl)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not start checkout.')
      setIsBuying(null)
    }
  }

  const resetChat = () => {
    setMessages([])
    setError('')
  }

  return (
    <div className="grid min-h-[min(72vh,52rem)] gap-6 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="flex min-h-[34rem] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">Learn AI</h2>
              <p className="text-xs text-slate-500">Answers tailored to your role and school</p>
            </div>
          </div>
          <button type="button" onClick={resetChat} disabled={messages.length === 0 || isSending} className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
            <RotateCcw className="size-3.5" aria-hidden="true" /> New chat
          </button>
        </header>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 text-xs sm:px-5">
          <span className="font-semibold text-slate-700">
            {balance ? `${balance.daily_remaining} daily · ${balance.paid_remaining} monthly tokens` : '23 daily tokens · refresh every 24 hours'}
          </span>
          {balance?.reset_at && <span className="text-slate-500">Refreshes {new Date(balance.reset_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="mx-auto flex max-w-2xl flex-col items-center py-8 text-center sm:py-12">
              <span className="mb-4 grid size-12 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
                <Bot className="size-6" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-bold text-slate-900">What would you like to learn?</h3>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">Ask a question, explore a topic, or get help preparing for a lesson or assessment.</p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-3">
                {prompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => void sendMessage(prompt)} disabled={isSending} className="min-h-14 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-slate-700 hover:border-emerald-600 hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`max-w-[min(46rem,95%)] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-emerald-800 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
              {message.content}
            </div>
          ))}
          {isSending && <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Thinking…</div>}
          {error && <p role="alert" className="mx-auto max-w-2xl rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
          <div ref={endRef} />
        </div>

        <form onSubmit={submitMessage} className="flex shrink-0 items-end gap-2 border-t border-slate-200 bg-white p-3 sm:p-4">
          <label htmlFor="learn-ai-page-message" className="sr-only">Message Learn AI</label>
          <textarea
            id="learn-ai-page-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={4000}
            rows={2}
            placeholder="Ask a question…"
            className="min-h-11 min-w-0 flex-1 resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
          />
          <button type="submit" disabled={isSending || !input.trim()} aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
            <Send className="size-4" aria-hidden="true" />
          </button>
        </form>
      </section>

      <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-emerald-800" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900">Token balance</h2>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {balance ? balance.daily_remaining + balance.paid_remaining : '—'}
            <span className="ml-1 text-sm font-medium text-slate-500">available</span>
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">23 free credits refresh every 24 hours. Purchased tokens expire after 30 days.</p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">Monthly packages</h2>
            <ArrowUpRight className="size-4 text-slate-400" aria-hidden="true" />
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {packages.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.tokens} tokens</p>
                  <p className="text-xs text-slate-500">₦{item.price}</p>
                </div>
                <button type="button" disabled={isBuying !== null} onClick={() => void buyPackage(item.id)} className="min-h-9 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:border-emerald-700 hover:text-emerald-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
                  {isBuying === item.id ? 'Opening…' : 'Buy'}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">Secure one-time Paystack checkout. Token pack valid for 30 days.</p>
        </section>
      </aside>
    </div>
  )
}