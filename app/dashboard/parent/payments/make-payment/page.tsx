'use client'

import { useState } from 'react'
import { initiatePayment, generateKorapayCheckoutLink, FEE_STRUCTURE, type FeeType } from '@/app/actions/payments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

export default function MakePaymentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [feeType, setFeeType] = useState<FeeType>('tuition')
  const [studentId, setStudentId] = useState('')

  const amount = FEE_STRUCTURE[feeType]

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!studentId.trim()) {
      alert('Please enter your child\'s admission number')
      return
    }

    setIsLoading(true)
    try {
      const reference = `KOA-${Date.now()}-${Math.random().toString(36).substring(7)}`
      
      // Create payment record
      await initiatePayment({
        studentId,
        feeType,
        amount,
        reference,
      })

      // Generate Korapay checkout link
      const checkoutUrl = await generateKorapayCheckoutLink({
        reference,
        amount,
        customerEmail: 'parent@example.com', // In real app, get from session
        customerName: 'Parent Name', // In real app, get from session
      })

      // In production, redirect to Korapay checkout
      // For now, show success message
      alert(`Payment initiated!\nReference: ${reference}\nAmount: ₦${amount.toLocaleString()}\n\nIn production, you would be redirected to Korapay checkout.`)
      router.push('/dashboard/parent/payments')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to initiate payment')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Make Payment</h1>
        <p className="text-gray-600 mt-1">Pay your child's school fees</p>
      </div>

      <form onSubmit={handlePayment} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Enter payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Child's Admission Number</Label>
              <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., GOD12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feeType">Fee Type</Label>
              <select
                id="feeType"
                value={feeType}
                onChange={(e) => setFeeType(e.target.value as FeeType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {Object.entries(FEE_STRUCTURE).map(([type, _]) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).replace(/([A-Z])/g, ' $1')}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-green-200">
              <span className="text-gray-600">Fee Type:</span>
              <span className="font-semibold text-gray-900 capitalize">
                {feeType.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-green-200">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-gray-900">₦{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold text-gray-900">Korapay</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              You will be redirected to Korapay's secure payment gateway to complete your payment. Multiple payment methods are accepted including bank transfer, card, and mobile money.
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
