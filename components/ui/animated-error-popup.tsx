'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnimatedErrorPopupProps {
  title?: string
  message: string
  onRetry?: () => void
  onClose?: () => void
}

export function AnimatedErrorPopup({
  title = 'An Error Occurred',
  message,
  onRetry,
  onClose,
}: AnimatedErrorPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-200 space-y-4 relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        <div className="flex items-start gap-4 pt-2">
          <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="font-black text-slate-900 text-lg">{title}</h3>
            <p className="text-slate-600 text-xs leading-relaxed font-semibold">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl font-bold text-xs border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Close
            </Button>
          )}
          {onRetry && (
            <Button
              type="button"
              onClick={onRetry}
              className="rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
