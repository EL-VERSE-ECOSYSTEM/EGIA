'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CreditCard, ShieldCheck,
  CheckCircle2, Info, Loader2, XCircle
} from 'lucide-react'
import { getLinkedChildren } from '@/app/actions/user'
import { getPaystackGatewayFee, initializePaystackPayment, getFeeStructuresForClass } from '@/app/actions/payments'
import { getSchoolPaymentConfigAction } from '@/app/actions/payment-config'
import { ManualPaymentPanel } from '@/components/payments/ManualPaymentPanel'

type ChildRecord = Awaited<ReturnType<typeof getLinkedChildren>>[number]
type PaymentConfig = Awaited<ReturnType<typeof getSchoolPaymentConfigAction>>
type AvailableFee = Awaited<ReturnType<typeof getFeeStructuresForClass>>[number]

export default function MakePaymentPage() {
  const [children, setChildren] = useState<ChildRecord[]>([])
  const [childId, setChildId] = useState('')
  const [feeType, setFeeType] = useState('')
  const [amount, setAmount] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [gatewayFee, setGatewayFee] = useState(0)
  const [checkoutStatus, setCheckoutStatus] = useState<'processing' | 'failed' | null>(null)
  const [checkoutError, setCheckoutError] = useState('')

  // Payment configuration state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(null)

  // Dynamic Admin Fee structures
  const [availableFees, setAvailableFees] = useState<AvailableFee[]>([])

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setChildren(await getLinkedChildren())
        setGatewayFee(await getPaystackGatewayFee())
      } catch (error) {
        console.error('Unable to load payment information:', error)
      }
    }
    void loadPaymentData()
  }, [])

  // Fetch fees when a child is selected
  const handleChildSelect = async (id: string) => {
    setChildId(id)
    const selectedChild = children.find(c => c.id === id)
    if (selectedChild) {
      try {
        setPaymentConfig(selectedChild.schoolId
          ? await getSchoolPaymentConfigAction(selectedChild.schoolId)
          : null)
        const fees = await getFeeStructuresForClass(selectedChild.class, selectedChild.department ?? undefined, selectedChild.id)
        setAvailableFees(fees || [])
        setFeeType('')
        setAmount('')
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleFeeSelect = (type: string) => {
    setFeeType(type)
    const selectedFee = availableFees.find(f => f.feeType === type)
    if (selectedFee) {
      setAmount(selectedFee.amount)
    }
  }

  const handlePayment = async () => {
    if (!childId || !feeType) {
      setCheckoutError('Choose a student and fee category before continuing.')
      setCheckoutStatus('failed')
      return
    }
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setCheckoutError('There is no outstanding amount available for this fee category.')
      setCheckoutStatus('failed')
      return
    }

    setIsUploading(true)
    setCheckoutError('')
    setCheckoutStatus('processing')
    try {
      const result = await initializePaystackPayment({
        studentId: childId,
        amount: parseFloat(amount),
        feeType,
      })
      setCheckoutStatus(null)
      window.location.assign(result.checkoutUrl)
    } catch (err) {
      console.error(err)
      setCheckoutError(err instanceof Error ? err.message : 'Payment could not be initialized.')
      setCheckoutStatus('failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/30">
        {checkoutStatus && (
          <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
            <section role="dialog" aria-modal="true" aria-labelledby="checkout-status-title" className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${checkoutStatus === 'processing' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                {checkoutStatus === 'processing' ? <Loader2 className="h-9 w-9 animate-spin" /> : <XCircle className="h-9 w-9 animate-in zoom-in duration-300" />}
              </div>
              <p className={`text-xs font-black uppercase tracking-[0.2em] ${checkoutStatus === 'processing' ? 'text-amber-700' : 'text-red-700'}`}>
                {checkoutStatus === 'processing' ? 'Secure checkout' : 'Checkout could not start'}
              </p>
              <h2 id="checkout-status-title" className="mt-2 text-2xl font-black text-slate-900">
                {checkoutStatus === 'processing' ? 'Preparing secure payment' : 'Payment not started'}
              </h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
                {checkoutStatus === 'processing'
                  ? 'Your payment details are being validated and a secure checkout session is being prepared.'
                  : checkoutError}
              </p>
              {checkoutStatus === 'failed' && (
                <Button onClick={() => setCheckoutStatus(null)} className="mt-6 h-12 rounded-xl bg-slate-900 px-7 font-bold hover:bg-slate-800">Review details</Button>
              )}
            </section>
          </div>
        )}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Secure Payment Portal</h1>
          <p className="text-slate-500 text-lg font-medium">Quick and reliable fee processing for EL LEARNERS APP.</p>
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
                  <Select onValueChange={handleChildSelect}>
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
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fee Category (Created by Admin)</Label>
                  <Select onValueChange={handleFeeSelect} value={feeType}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-emerald-600">
                      <SelectValue placeholder="What are you paying for?" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFees.length === 0 ? (
                        <SelectItem value="none" disabled>No active fees set by Admin for this class</SelectItem>
                      ) : (
                        availableFees.map(f => (
                          <SelectItem key={f.id} value={f.feeType} disabled={Number(f.amount) <= 0}>
                            {f.feeType} (₦{parseFloat(f.amount).toLocaleString()}{Number(f.amount) <= 0 ? ' · Paid' : ' remaining'})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (₦) - Pre-approved by Admin</Label>
                  <Input
                    type="text"
                    value={amount ? `₦${parseFloat(amount).toLocaleString()}` : ''}
                    readOnly
                    placeholder="₦0.00"
                    className="text-4xl font-black h-24 rounded-3xl border-slate-200 bg-slate-50/50 text-emerald-600 focus:bg-white focus:ring-emerald-600 cursor-not-allowed"
                  />
                </div>
              </CardContent>
            </Card>

            {paymentConfig?.usePaystack === false && children.some(c => c.id === childId) ? (
              <ManualPaymentPanel
                config={paymentConfig}
                amount={parseFloat(amount || '0')}
                schoolId={children.find(c => c.id === childId)?.schoolId || ''}
                studentId={childId}
                parentId={children.find(c => c.id === childId)?.parentId || ''}
                feeType={feeType}
                onReceiptUploaded={() => alert('Receipt uploaded — awaiting admin confirmation')}
              />
            ) : (
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 ml-2">Payment Method</h3>
                <div className="p-8 rounded-[2rem] border-4 border-emerald-600 bg-emerald-50 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-600 text-white">
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <p className="font-black text-slate-900">Instant Online Payment</p>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Card/USSD/Transfer</p>
                  </div>
                  <CheckCircle2 className="ml-auto text-emerald-600 w-6 h-6" />
                </div>
              </div>
            )}

          </div>

          <div className="space-y-8">
            {paymentConfig?.usePaystack !== false && (
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
                    <span className="text-white">₦{gatewayFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-[1px] bg-white/10 my-6" />
                  <div className="flex justify-between text-2xl font-black">
                    <span>Total</span>
                    <span className="text-amber-500 font-mono">₦{(parseFloat(amount || '0') + gatewayFee).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
                <CardFooter className="p-10 pt-0 flex flex-col gap-6">
                  <Button
                    onClick={handlePayment}
                    disabled={!amount || !childId || isUploading}
                    className="w-full h-20 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl text-xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] transition-all hover:scale-105"
                  >
                    {isUploading ? <Loader2 className="animate-spin w-8 h-8" /> : 'COMPLETE PAYMENT'}
                  </Button>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Secured online with SSL encryption
                  </div>
                </CardFooter>
              </Card>
            )}

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
