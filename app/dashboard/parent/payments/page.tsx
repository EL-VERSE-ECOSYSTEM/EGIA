'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DollarSign, History, FileText } from 'lucide-react'
import { FEE_STRUCTURE } from '@/app/actions/payments'

export default function PaymentsPage() {
  const totalFees = Object.values(FEE_STRUCTURE).reduce((sum, fee) => sum + fee, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Fees Management</h1>
        <p className="text-gray-600 mt-1">View and pay your child's school fees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">₦{totalFees.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-2">All fee types combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₦0</div>
            <p className="text-xs text-gray-500 mt-2">Completed payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">₦{totalFees.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-2">Amount due</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown</CardTitle>
          <CardDescription>Detailed breakdown of all school fees</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(FEE_STRUCTURE).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-gray-600">School {type === 'tuition' ? 'tuition fees' : type === 'development' ? 'development levy' : 'fees'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₦{amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Not paid</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/parent/payments/make-payment">
            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
              <DollarSign className="w-4 h-4" />
              Pay Fees
            </Button>
          </Link>
          <Link href="/dashboard/parent/payments/history">
            <Button variant="outline" className="w-full gap-2">
              <History className="w-4 h-4" />
              Payment History
            </Button>
          </Link>
          <Link href="/dashboard/parent/payments/receipts">
            <Button variant="outline" className="w-full gap-2">
              <FileText className="w-4 h-4" />
              Receipts
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
