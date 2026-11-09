'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bot, LoaderCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }
type Balance = { daily_remaining: number; paid_remaining: number; reset_at: string }

const packages = [
  { id: 'starter', tokens: 35, price: '5,200' },
  { id: 'standard', tokens: 50, price: '6,800' },
  { id: 'plus', tokens: 75, price: '8,000' },
  { id: 'maximum', tokens: 100, price: '10,400' },
] as const

export function FloatingLearnAiWidget() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [balance, setBalance] = useState<Balance | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isBuying, setIsBuying] = useState<string | null>(null)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadBalance = async () => {
    try {
      const response = await fetch('/api/learn-ai/chat', { cache: 'no-store' })
      const result = await response.json()
      if (response.ok) setBalance(result)
      else setError(result.error || 'Sign in to use Learn AI.')
    } catch {
      setError('Learn AI is temporarily unavailable.')
    }
  }

  useEffect(() => {
    if (!isOpen) return
    void loadBalance()
    const closeForSupport = () => setIsOpen(false)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('support-widget-open', closeForSupport)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('support-widget-open', closeForSupport)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, isSending])

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = input.trim()
    if (!content || isSending) return

    const nextMessages = [...messages, { role: 'user' as const, content }].slice(-10)
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

  const openWidget = () => {
    if (!isOpen) window.dispatchEvent(new Event('learn-ai-widget-open'))
    setIsOpen((open) => !open)
  }

  if (pathname?.startsWith('/dashboard/learn-ai')) return null

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 sm:right-6 z-[998] font-sans">
      {isOpen && (
        <section
          id="learn-ai-panel"
          role="dialog"
          aria-label="Learn AI chat"
          className="absolute bottom-[calc(100%+0.75rem)] right-0 flex h-[min(38rem,calc(100dvh-7rem))] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-emerald-400 text-slate-950">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-bold">Learn AI</h2>
                <p className="text-xs text-slate-300">Your school-aware learning assistant</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close Learn AI" className="grid size-9 place-items-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-2.5 text-xs">
            <div className="min-w-0 font-medium text-slate-600">
              <p>{balance ? `${balance.daily_remaining} daily · ${balance.paid_remaining} monthly` : '23 tokens renew every 24 hours'}</p>
              {balance?.reset_at && <p className="mt-0.5 text-[11px] font-normal text-slate-500">Daily refresh {new Date(balance.reset_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>}
            </div>
            {balance && <span className="shrink-0 text-right text-[11px] text-slate-500">Monthly tokens expire after 30 days</span>}
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3" aria-live="polite">
            {messages.length === 0 && (
              <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <Bot className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <p>Ask a school question, explore a topic, or get help planning your next lesson.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                {message.content}
              </div>
            ))}
            {isSending && <div className="flex items-center gap-2 text-xs text-slate-500"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Thinking…</div>}
            {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p>}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={submitMessage} className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-3">
            <label htmlFor="learn-ai-message" className="sr-only">Message Learn AI</label>
            <input
              id="learn-ai-message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={4000}
              placeholder="Ask Learn AI…"
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20"
            />
            <button type="submit" disabled={isSending || !input.trim()} aria-label="Send message" className="grid size-11 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>

          <details className="shrink-0 border-t border-slate-200 bg-white px-3 py-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-700">Monthly token packages</summary>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {packages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isBuying !== null}
                  onClick={() => void buyPackage(item.id)}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-slate-300 px-2.5 text-left text-xs hover:border-emerald-700 hover:bg-emerald-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <span className="font-semibold">{item.tokens} tokens</span>
                  <span>₦{item.price}</span>
                </button>
              ))}
            </div>
            {isBuying && <p className="pt-2 text-xs text-slate-500">Opening secure checkout…</p>}
          </details>
        </section>
      )}

      <button
        type="button"
        onClick={openWidget}
        aria-label={isOpen ? 'Close Learn AI' : 'Open Learn AI'}
        aria-expanded={isOpen}
        aria-controls="learn-ai-panel"
        title="Learn AI"
        className="grid size-14 place-items-center rounded-2xl border border-emerald-300 bg-emerald-700 text-white shadow-lg transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 motion-reduce:transition-none"
      >
        {isOpen ? <X className="size-6" aria-hidden="true" /> : <MessageCircle className="size-6" aria-hidden="true" />}
      </button>
    </div>
  )
}