'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Wallet, Banknote, ShieldCheck } from 'lucide-react'

export default function MakePaymentPage() {
  const [amount, setAmount] = useState('')
  const [feeType, setFeeType] = useState('')
  const [child, setChild] = useState('')

  const children = [
    { id: '1', name: 'Divine Goodnews', class: 'JSS 3A' },
    { id: '2', name: 'Mercy Goodnews', class: 'JSS 1C' }
  ]

  const feeTypes = [
    { id: 'tuition', name: 'Tuition Fees', amount: '55000' },
    { id: 'exam', name: 'Examination Fees', amount: '5000' },
    { id: 'bus', name: 'School Bus', amount: '15000' },
    { id: 'uniform', name: 'Uniforms', amount: '12000' }
  ]

  const handleFeeTypeChange = (val: string) => {
    setFeeType(val)
    const selected = feeTypes.find(f => f.id === val)
    if (selected) setAmount(selected.amount)
  }

  const handlePayment = async () => {
    // In production, this would initialize Korapay payment
    alert(`Initializing Korapay payment for ₦${amount}...`)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-800">Make Payment</h1>
        <p className="text-slate-600">Securely pay school fees and levies using Korapay.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Select student and fee category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="child">Select Child</Label>
                <Select onValueChange={setChild}>
                  <SelectTrigger id="child">
                    <SelectValue placeholder="Choose child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.class})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feeType">Fee Category</Label>
                <Select onValueChange={handleFeeTypeChange}>
                  <SelectTrigger id="feeType">
                    <SelectValue placeholder="Select what you are paying for" />
                  </SelectTrigger>
                  <SelectContent>
                    {feeTypes.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="text-2xl font-bold h-16"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-emerald-500 bg-emerald-50 p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer">
                <CreditCard className="w-8 h-8 text-emerald-600" />
                <span className="font-semibold text-emerald-900 text-sm">Card</span>
              </div>
              <div className="border-2 border-slate-100 p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:border-emerald-200">
                <Wallet className="w-8 h-8 text-slate-400" />
                <span className="font-semibold text-slate-600 text-sm">Bank Transfer</span>
              </div>
              <div className="border-2 border-slate-100 p-4 rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:border-emerald-200">
                <Banknote className="w-8 h-8 text-slate-400" />
                <span className="font-semibold text-slate-600 text-sm">USSD</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-emerald-900 text-white border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-emerald-400">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-emerald-100">
                <span>Subtotal</span>
                <span>₦{amount || '0.00'}</span>
              </div>
              <div className="flex justify-between text-emerald-100">
                <span>Processing Fee</span>
                <span>₦0.00</span>
              </div>
              <div className="border-t border-emerald-800 pt-4 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-emerald-400">₦{amount || '0.00'}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button onClick={handlePayment} className="w-full bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-extrabold py-8 text-lg">
                Pay Now
              </Button>
              <div className="flex items-center gap-2 text-xs text-emerald-300 justify-center">
                <ShieldCheck className="w-4 h-4" />
                Secured by Korapay
              </div>
            </CardFooter>
          </Card>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            <p className="font-bold mb-1">Important Note:</p>
            Please ensure you have sufficient funds in your account before proceeding. Your receipt will be generated automatically after a successful transaction.
          </div>
        </div>
      </div>
    </div>
  )
}
