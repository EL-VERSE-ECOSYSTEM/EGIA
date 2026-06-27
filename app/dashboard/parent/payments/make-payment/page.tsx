'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CreditCard, Banknote, ShieldCheck,
  CheckCircle2, Info, ArrowRight,
  Upload, Loader2
} from 'lucide-react'
import { getLinkedChildren } from '@/app/actions/user'
import { submitManualPayment, initializeKorapayPayment } from '@/app/actions/payments'
import { useRouter } from 'next/navigation'

export default function MakePaymentPage() {
  const router = useRouter()
  const [children, setChildren] = useState<any[]>([])
  const [childId, setChildId] = useState('')
  const [feeType, setFeeType] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'KORAPAY' | 'MANUAL'>('KORAPAY')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    getLinkedChildren().then(setChildren)
  }, [])

  const feeTypes = [
    { id: 'tuition', name: 'Tuition Fee' },
    { id: 'development', name: 'Development Levy' },
    { id: 'exam', name: 'Examination Fee' },
    { id: 'pta', name: 'PTA Levy' },
    { id: 'ICT', name: 'ICT Fee' },
    { id: 'uniform', name: 'Uniform Fee' }
  ]

  const handlePayment = async () => {
    if (!childId || !feeType || !amount) return alert('Fill all details')

    setIsUploading(true)
    try {
      if (method === 'MANUAL') {
        if (!receipt) return alert('Please upload receipt')
        await submitManualPayment({
          studentId: childId,
          amount,
          feeType,
          receiptUrl: 'mock-receipt-url'
        })
        alert('Manual payment submitted for verification')
        router.push('/dashboard/parent/payments/history')
      } else {
        const result = await initializeKorapayPayment({
          studentId: childId,
          amount: parseFloat(amount),
          feeType,
        })
        window.location.href = result.checkoutUrl
      }
    } catch (err) {
      console.error(err)
      alert('Payment failed to initialize')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/30">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Secure Payment Portal</h1>
          <p className="text-slate-500 text-lg font-medium">Quick and reliable fee processing for EL GOODNEWS INT'L ACADEMY.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden bg-white">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-black text-slate-900">Payment Details</CardTitle>
                <CardDescription className="text-slate-400 font-bold">Select student and fee category</CardDescription>
              </CardHeader>
              <CardContent className="px-10 pb-12 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Child</Label>
                  <Select onValueChange={setChildId}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-emerald-600">
                      <SelectValue placeholder="Choose student" />
                    </SelectTrigger>
                    <SelectContent>
                      {children.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.class})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fee Category</Label>
                  <Select onValueChange={setFeeType}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-emerald-600">
                      <SelectValue placeholder="What are you paying for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeTypes.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (₦)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-4xl font-black h-24 rounded-3xl border-slate-200 bg-slate-50/50 text-emerald-600 focus:bg-white focus:ring-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 ml-2">Choose Payment Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => setMethod('KORAPAY')}
                  className={`p-8 rounded-[2rem] border-4 transition-all cursor-pointer flex items-center gap-6 ${method === 'KORAPAY' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${method === 'KORAPAY' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">Instant Online</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Card/USSD/Transfer</p>
                  </div>
                  {method === 'KORAPAY' && <CheckCircle2 className="ml-auto text-emerald-600 w-6 h-6" />}
                </div>

                <div
                  onClick={() => setMethod('MANUAL')}
                  className={`p-8 rounded-[2rem] border-4 transition-all cursor-pointer flex items-center gap-6 ${method === 'MANUAL' ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 bg-white hover:border-emerald-200'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${method === 'MANUAL' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Banknote size={32} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">Direct Transfer</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Upload Receipt</p>
                  </div>
                  {method === 'MANUAL' && <CheckCircle2 className="ml-auto text-emerald-600 w-6 h-6" />}
                </div>
              </div>
            </div>

            {method === 'MANUAL' && (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="p-10">
                  <CardTitle className="text-xl font-black">Transfer Instructions</CardTitle>
                </CardHeader>
                <CardContent className="px-10 pb-12 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Option 1: First Bank</p>
                       <p className="text-lg font-black text-slate-900">3069520782</p>
                       <p className="text-sm font-bold text-slate-500">Onoha Happiness</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Option 2: GT Bank</p>
                       <p className="text-lg font-black text-slate-900">0649893280</p>
                       <p className="text-sm font-bold text-slate-500">Onoha Happiness</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Upload Transfer Receipt</Label>
                    <div className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center space-y-4 hover:bg-slate-50 transition-colors relative">
                       <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                       />
                       <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <Upload size={32} />
                       </div>
                       {receipt ? (
                         <p className="font-black text-emerald-600">{receipt.name}</p>
                       ) : (
                         <div>
                            <p className="font-black text-slate-900 text-lg">Click to select or drag and drop</p>
                            <p className="text-sm font-medium text-slate-400">PDF, JPG, PNG (Max 5MB)</p>
                         </div>
                       )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden sticky top-28">
              <CardHeader className="p-10 pb-0">
                <CardTitle className="text-amber-500 text-sm font-black uppercase tracking-[0.3em]">Checkout Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-6">
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Subtotal</span>
                  <span className="text-white">₦{parseFloat(amount || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400 font-bold">
                  <span>Processing Fee</span>
                  <span className="text-white">₦0.00</span>
                </div>
                <div className="h-[1px] bg-white/10 my-6" />
                <div className="flex justify-between text-2xl font-black">
                  <span>Total</span>
                  <span className="text-amber-500 font-mono">₦{parseFloat(amount || '0').toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0 flex flex-col gap-6">
                <Button
                  onClick={handlePayment}
                  disabled={!amount || !childId || isUploading}
                  className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl text-xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
                >
                  {isUploading ? <Loader2 className="animate-spin w-8 h-8" /> : (method === 'MANUAL' ? 'SUBMIT RECEIPT' : 'COMPLETE PAYMENT')}
                </Button>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Secured by Korapay & SSL
                </div>
              </CardFooter>
            </Card>

            <div className="p-10 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex gap-6">
              <Info className="text-blue-600 shrink-0 w-8 h-8" />
              <div>
                <p className="font-black text-blue-900 mb-2">Need Assistance?</p>
                <p className="text-blue-700 text-sm font-medium leading-relaxed">
                   If you encounter any issues with payment, please contact our support team at <span className="font-black tracking-widest">+2348108854279</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
