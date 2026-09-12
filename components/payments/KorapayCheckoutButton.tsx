'use client'

import React, { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

interface KorapayCheckoutButtonProps {
  amount: number
  customerEmail: string
  customerName?: string
  description?: string
  currency?: string
  metadata?: Record<string, any>
  buttonText?: string
  className?: string
  disabled?: boolean
  onSuccess?: (reference: string) => void
  onError?: (error: string) => void
}

export function KorapayCheckoutButton({
  amount,
  customerEmail,
  customerName,
  description,
  currency = 'NGN',
  metadata,
  buttonText,
  className,
  disabled = false,
  onSuccess,
  onError,
}: KorapayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePayment = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      if (!amount || amount <= 0) {
        throw new Error('Please specify a valid payment amount.')
      }
      if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        throw new Error('Please specify a valid customer email address.')
      }

      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          customerEmail,
          customerName,
          description,
          currency,
          metadata,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Failed to initialize payment transaction.')
      }

      if (onSuccess && data.reference) {
        onSuccess(data.reference)
      }

      // Redirect user to Korapay hosted checkout page
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
    currency: currency || 'NGN',
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
            <span>Redirecting to Korapay Checkout…</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{buttonText || `Pay ${formattedAmount} via Korapay`}</span>
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
