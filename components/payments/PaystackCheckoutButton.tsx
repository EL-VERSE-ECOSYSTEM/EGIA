'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

interface PaystackCheckoutButtonProps {
  amount: number
  studentId: string
  feeType: string
  buttonText?: string
  className?: string
  disabled?: boolean
  onSuccess?: (reference: string) => void
  onError?: (error: string) => void
}

export function PaystackCheckoutButton({
  amount,
  studentId,
  feeType,
  buttonText,
  className,
  disabled = false,
  onSuccess,
  onError,
}: PaystackCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      if (!amount || amount <= 0) {
        throw new Error('Please specify a valid payment amount.')
      }
      if (!studentId || !feeType) {
        throw new Error('Choose a student and an active school fee.')
      }

      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          studentId,
          feeType,
        }),
      })

      const data = await res.json() as { checkoutUrl?: string; reference?: string; error?: string }

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to initialize payment transaction.')
      }

      if (onSuccess && data.reference) {
        onSuccess(data.reference)
      }

      // Redirect the user to the secure hosted checkout.
      window.location.href = data.checkoutUrl
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred during payment initialization.'
      setErrorMessage(msg)
      if (onError) {
        onError(msg)
      }
      setLoading(false)
    }
  }

  const totalWithFee = (amount || 0) + 161.25
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(totalWithFee)

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading || disabled}
        className={
          className ||
          'w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed text-sm'
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting to secure payment…</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{buttonText || `Pay ${formattedAmount} online`}</span>
          </>
        )}
      </button>
      {errorMessage && (
        <p className="text-xs text-red-600 font-medium text-center bg-red-50 p-2 rounded-lg border border-red-100">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
