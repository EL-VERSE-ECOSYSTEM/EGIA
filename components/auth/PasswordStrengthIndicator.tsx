'use client'

import React from 'react'
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const hasLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const score = [hasLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length

  let strengthLabel = 'Weak'
  let progressColor = 'bg-rose-500'
  let textColor = 'text-rose-400'

  if (score >= 5) {
    strengthLabel = 'Very Strong'
    progressColor = 'bg-emerald-500'
    textColor = 'text-emerald-400'
  } else if (score >= 4) {
    strengthLabel = 'Strong'
    progressColor = 'bg-teal-500'
    textColor = 'text-teal-400'
  } else if (score >= 3) {
    strengthLabel = 'Fair'
    progressColor = 'bg-amber-500'
    textColor = 'text-amber-400'
  }

  const rules = [
    { label: 'At least 8 characters', valid: hasLength },
    { label: 'Uppercase letter (A-Z)', valid: hasUppercase },
    { label: 'Lowercase letter (a-z)', valid: hasLowercase },
    { label: 'Number (0-9)', valid: hasNumber },
    { label: 'Special character (!@#$)', valid: hasSpecial },
  ]

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-bold transition-all">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 uppercase tracking-wider text-[10px] font-black flex items-center gap-1.5">
          {score >= 4 ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
          Password Strength:
        </span>
        <span className={`font-black uppercase tracking-wider text-[11px] ${textColor}`}>
          {strengthLabel} ({score * 20}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex gap-1 p-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-full flex-1 rounded-full transition-all duration-500 ${
              score >= level ? progressColor : 'bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Rules Criteria */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {rules.map((rule, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[10px]">
            {rule.valid ? (
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
            ) : (
              <X className="w-3 h-3 text-slate-500 shrink-0" />
            )}
            <span className={rule.valid ? 'text-slate-200' : 'text-slate-500'}>
              {rule.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
