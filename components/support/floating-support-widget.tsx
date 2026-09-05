'use client'

import React, { useState } from 'react'
import { MessageSquare, Phone, X, ExternalLink, HelpCircle } from 'lucide-react'

export function FloatingSupportWidget() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-white w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-400" />
              <span className="font-black text-sm text-white">Help & Support</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">
            Need assistance with registration, payments, or portal access?
          </p>

          <a
            href="https://wa.me/2348061908715"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <Phone className="w-4 h-4" />
            <span>WhatsApp Connect: (234)8061908715</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center shadow-2xl shadow-emerald-500/30 transition-transform duration-300 hover:scale-110 active:scale-95"
        title="Help and Support"
      >
        <MessageSquare className="w-6 h-6 fill-current" />
      </button>
    </div>
  )
}
