'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md space-y-6 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-3xl text-rose-400 inline-block animate-pulse">
            <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-black">System Recovery Mode</h1>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            A critical unexpected system error occurred. Click below to re-initialize your session smoothly.
          </p>
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl h-12 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Re-initialize App
          </button>
        </div>
      </body>
    </html>
  )
}
