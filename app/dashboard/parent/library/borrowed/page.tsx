'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen, Calendar, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

export default function ParentBorrowedBooksPage() {
  const [borrowedItems, setBorrowedItems] = useState([
    {
      id: 'loan-1',
      studentName: 'Chidi Obi',
      admissionNumber: 'EGIA/2023/048',
      title: 'Essential Mathematics for Senior Secondary Schools (Book 1)',
      isbn: 'ISBN-97810482',
      borrowedAt: '2025-02-10',
      dueDate: '2025-02-24',
      status: 'BORROWED',
      fineAmount: 0
    },
    {
      id: 'loan-2',
      studentName: 'Chidi Obi',
      admissionNumber: 'EGIA/2023/048',
      title: 'Modern Biology for Senior Secondary Schools',
      isbn: 'ISBN-97812048',
      borrowedAt: '2025-01-15',
      dueDate: '2025-01-29',
      status: 'OVERDUE',
      fineAmount: 250 // Simulated fine in Naira
    }
  ])

  const handleRenewRequest = (id: string, title: string) => {
    alert(`🔄 Renewal request sent for "${title}". A notification will be dispatched once approved by the librarian.`)
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Borrowed Books</h1>
          <p className="text-slate-500 text-lg font-medium">
            Monitor and renew active book loans borrowed by your linked children from the academy physical library.
          </p>
        </div>

        {/* Warning card for overdue books */}
        {borrowedItems.some(item => item.status === 'OVERDUE') && (
          <Card className="border-none bg-red-50 border border-red-100 rounded-3xl p-6 flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-2xl text-red-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-red-950 text-lg">Action Required: Overdue Book Alert</h3>
              <p className="text-red-700 text-sm font-medium">
                One or more books currently in your children's possession have passed their return deadline. Please return them to the library as soon as possible to avoid further daily late fees.
              </p>
            </div>
          </Card>
        )}

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black">Active Loans Registry</CardTitle>
            <CardDescription className="font-bold text-slate-400">Current textbooks and resource materials checked out</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {borrowedItems.length === 0 ? (
              <div className="p-24 text-center text-slate-400 italic font-bold">No active loans found. All books returned!</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Wards Details</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Book Title</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Borrowed Date</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Due Date</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Status</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {borrowedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-6">
                        <p className="font-black text-slate-900 text-sm">{item.studentName}</p>
                        <p className="text-xs text-slate-400 font-bold">{item.admissionNumber}</p>
                      </TableCell>
                      <TableCell className="p-6">
                        <p className="font-black text-slate-900 text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs font-mono text-slate-400">{item.isbn}</p>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="flex items-center gap-1.5 font-bold text-slate-500 text-sm">
                          <Calendar size={14} /> {item.borrowedAt}
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <Clock size={14} className={item.status === 'OVERDUE' ? 'text-red-500' : 'text-slate-400'} />
                          {item.dueDate}
                        </div>
                      </TableCell>
                      <TableCell className="p-6">
                        <Badge className={`border-none font-black text-[10px] px-2.5 py-1 ${
                          item.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.status}
                        </Badge>
                        {item.fineAmount > 0 && (
                          <p className="text-[10px] font-black text-red-600 mt-1">Fine: ₦{item.fineAmount}</p>
                        )}
                      </TableCell>
                      <TableCell className="p-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRenewRequest(item.id, item.title)}
                          disabled={item.status === 'OVERDUE'}
                          className="rounded-xl border-slate-200 hover:border-emerald-600 hover:text-emerald-600 font-bold text-xs"
                        >
                          <RefreshCw size={12} className="mr-1.5" /> Renew Book
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
