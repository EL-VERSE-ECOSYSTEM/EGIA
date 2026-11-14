'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled app error:', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-3xl text-rose-400 animate-pulse">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-black">Something went wrong!</h1>
        <p className="text-slate-400 text-sm font-semibold leading-relaxed">
          {error.message || 'The application could not complete this page request.'}
        </p>
        {error.digest && <p className="text-xs font-mono text-slate-500">Reference: {error.digest}</p>}
      </div>

      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl px-6 h-12 text-xs uppercase tracking-wider shadow-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" /> Reload Page
        </Button>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl px-6 h-12 text-xs uppercase tracking-wider"
        >
          <Home className="w-4 h-4 mr-2" /> Go to Dashboard
        </a>
      </div>
    </div>
  )
}
