'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, Download, Printer, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react'
import { getParentPaymentHistory } from '@/app/actions/payments'
import { DashboardRealtimeSync } from '@/components/realtime/DashboardRealtimeSync'

export default function ReceiptsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const history = await getParentPaymentHistory()
        setPayments(history || [])
      } catch (err) {
        console.warn('Failed to load receipts:', err)
        setPayments([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const printReceipt = (p: any) => {
    const printWin = window.open('', '_blank')
    if (!printWin) return

    printWin.document.write(`
      <html>
        <head>
          <title>Payment Receipt - ${p.transactionReference || p.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #0f172a; }
            .receipt-box { border: 2px solid #0f172a; padding: 30px; max-width: 600px; margin: auto; border-radius: 16px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: 900; text-transform: uppercase; color: #1e3a8a; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
            .label { color: #64748b; font-size: 14px; font-weight: bold; }
            .value { font-weight: 900; font-size: 14px; }
            .total-box { background: #f8fafc; padding: 15px; border-radius: 12px; margin-top: 20px; text-align: right; }
            .total-amount { font-size: 24px; font-weight: 900; color: #166534; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <div class="title">EL LEARNERS APP</div>
              <div style="font-size: 12px; color: #64748b; font-weight: bold; margin-top: 4px;">OFFICIAL TRANSACTION RECEIPT</div>
            </div>
            <div class="row"><span class="label">Reference:</span><span class="value">${p.transactionReference || p.id}</span></div>
            <div class="row"><span class="label">Learner:</span><span class="value">${p.childName || 'Linked Learner'}</span></div>
            <div class="row"><span class="label">Fee Description:</span><span class="value">${p.feeType || p.description || 'School Fee'}</span></div>
            <div class="row"><span class="label">Payment Method:</span><span class="value">${p.paymentMethod || 'KORAPAY'}</span></div>
            <div class="row"><span class="label">Date:</span><span class="value">${new Date(p.createdAt || Date.now()).toLocaleDateString()}</span></div>
            <div class="row"><span class="label">Status:</span><span class="value" style="color: #166534;">${(p.status || 'SUCCESS').toUpperCase()}</span></div>
            <div class="total-box">
              <div class="label">Amount Paid:</div>
              <div class="total-amount">NGN ${Number(p.amount).toLocaleString()}</div>
            </div>
            <div class="footer">Thank you for your payment. Verified by EL LEARNERS APP Registry.</div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  return (
    <DashboardLayout role="parent">
      <DashboardRealtimeSync role="parent" />
      <div className="p-8 max-w-6xl mx-auto space-y-8 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payment Receipts</h1>
            <p className="text-slate-500 font-medium">View, print, and download official payment receipts for your ward's school fees.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 font-bold py-16">Accessing real-time payment records...</div>
        ) : payments.length === 0 ? (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-12 text-center space-y-4">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto" />
            <h3 className="text-xl font-black text-slate-900">No Payment Receipts Found</h3>
            <p className="text-slate-500 font-medium text-sm">Receipts will appear here automatically once payments are completed.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((p) => (
              <Card key={p.id} className="border-none shadow-lg rounded-[2rem] bg-white p-6 hover:shadow-xl transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-900 text-lg">{p.feeType || p.description || 'School Fee'}</p>
                        <Badge className={`font-black text-[10px] uppercase ${p.status === 'success' || p.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {p.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-1">
                        Learner: {p.childName} • Ref: <span className="font-mono">{p.transactionReference || p.id}</span> • {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <p className="text-xl font-black text-slate-900 font-mono">NGN {Number(p.amount).toLocaleString()}</p>
                    <Button onClick={() => printReceipt(p)} className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs h-11 px-5 rounded-xl flex items-center gap-2">
                      <Printer className="w-4 h-4" /> Download / Print
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
