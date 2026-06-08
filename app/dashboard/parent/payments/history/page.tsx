'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

export default function PaymentHistoryPage() {
  const transactions = [
    {
      id: 'KP_92837401',
      date: '2024-03-15',
      child: 'Divine Goodnews',
      type: 'Tuition Fees',
      amount: '55,000.00',
      status: 'SUCCESS',
      method: 'Card'
    },
    {
      id: 'KP_92837402',
      date: '2024-03-10',
      child: 'Mercy Goodnews',
      type: 'Uniforms',
      amount: '12,000.00',
      status: 'SUCCESS',
      method: 'Bank Transfer'
    },
    {
      id: 'KP_92837403',
      date: '2024-02-28',
      child: 'Divine Goodnews',
      type: 'School Bus',
      amount: '15,000.00',
      status: 'PENDING',
      method: 'USSD'
    },
    {
      id: 'KP_92837404',
      date: '2024-01-15',
      child: 'Mercy Goodnews',
      type: 'Tuition Fees',
      amount: '55,000.00',
      status: 'FAILED',
      method: 'Card'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Success</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-800">Payment History</h1>
          <p className="text-slate-600">Track all your school fee payments and download receipts.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-2" />
          Export All (PDF)
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by transaction ID or child name..." className="pl-10" />
        </div>
        <Button variant="outline" className="border-emerald-200 text-emerald-700">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50 border-b border-emerald-100">
                  <th className="p-4 font-bold text-emerald-900">Date</th>
                  <th className="p-4 font-bold text-emerald-900">Transaction ID</th>
                  <th className="p-4 font-bold text-emerald-900">Child</th>
                  <th className="p-4 font-bold text-emerald-900">Category</th>
                  <th className="p-4 font-bold text-emerald-900">Amount</th>
                  <th className="p-4 font-bold text-emerald-900">Status</th>
                  <th className="p-4 font-bold text-emerald-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-slate-600">{tx.date}</td>
                    <td className="p-4 font-mono text-sm text-slate-500">{tx.id}</td>
                    <td className="p-4 font-medium text-slate-900">{tx.child}</td>
                    <td className="p-4 text-slate-600">{tx.type}</td>
                    <td className="p-4 font-bold text-slate-900">₦{tx.amount}</td>
                    <td className="p-4">{getStatusBadge(tx.status)}</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                        Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between items-center text-sm text-slate-500">
        <p>Showing 4 of 48 transactions</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="bg-emerald-50 border-emerald-200 text-emerald-700 font-bold">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  )
}
