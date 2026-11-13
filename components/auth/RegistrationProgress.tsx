'use client'

import { Check } from 'lucide-react'

type RegistrationProgressProps = {
  steps: string[]
  currentStep: number
  onBack: () => void
  onNext: () => void
  accentClass: string
}

export function RegistrationProgress({ steps, currentStep, onBack, onNext, accentClass }: RegistrationProgressProps) {
  return (
    <div className="mb-7 space-y-5" aria-label={`Registration step ${currentStep + 1} of ${steps.length}`}>
      <div className="flex items-center gap-2" aria-hidden="true">
        {steps.map((step, index) => (
          <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${index <= currentStep ? accentClass : 'bg-slate-700'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Step {currentStep + 1} of {steps.length}</p>
          <p className="mt-1 text-sm font-bold text-white">{steps[currentStep]}</p>
        </div>
        <div className="flex items-center gap-2">
          {currentStep > 0 && <button type="button" onClick={onBack} className="h-10 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-800">Back</button>}
          {currentStep < steps.length - 1 && <button type="button" onClick={onNext} className={`h-10 rounded-xl px-4 text-sm font-bold text-white shadow-lg ${accentClass} hover:brightness-110`}>Continue <span aria-hidden="true">→</span></button>}
          {currentStep === steps.length - 1 && <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><Check size={15} /> Ready to submit</span>}
        </div>
      </div>
    </div>
  )
}
