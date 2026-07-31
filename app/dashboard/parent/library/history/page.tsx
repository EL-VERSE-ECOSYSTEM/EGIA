'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen, Calendar, CheckCircle2 } from 'lucide-react'

export default function ParentLibraryHistoryPage() {
  const [historyItems, setHistoryItems] = useState([
    {
      id: 'hist-1',
      studentName: 'Chidi Obi',
      admissionNumber: 'EGIA/2023/048',
      title: 'New School Physics for SSS',
      isbn: 'ISBN-97813592',
      borrowedAt: '2024-11-02',
      returnedAt: '2024-11-16',
      status: 'RETURNED_ON_TIME'
    },
    {
      id: 'hist-2',
      studentName: 'Chidi Obi',
      admissionNumber: 'EGIA/2023/048',
      title: 'Interactive English Grammar & Composition',
      isbn: 'ISBN-97811984',
      borrowedAt: '2024-10-05',
      returnedAt: '2024-10-22',
      status: 'RETURNED_LATE'
    }
  ])

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Borrowing History</h1>
          <p className="text-slate-500 text-lg font-medium">
            Analyze historical records of physical textbooks borrowed and successfully returned by your children.
          </p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black">Archived Transactions Ledger</CardTitle>
            <CardDescription className="font-bold text-slate-400">Chronological history of completed returns</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {historyItems.length === 0 ? (
              <div className="p-24 text-center text-slate-400 italic font-bold">No historical loans found in the system.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Wards Details</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Book Title</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Borrowed Date</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Returned Date</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Resolution Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {historyItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-6">
                        <p className="font-black text-slate-900 text-sm">{item.studentName}</p>
                        <p className="text-xs text-slate-400 font-bold">{item.admissionNumber}</p>
                      </TableCell>
                      <TableCell className="p-6">
                        <p className="font-black text-slate-900 text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs font-mono text-slate-400">{item.isbn}</p>
                      </TableCell>
                      <TableCell className="p-6 font-bold text-slate-500 text-sm">{item.borrowedAt}</TableCell>
                      <TableCell className="p-6 font-bold text-slate-900 text-sm">{item.returnedAt}</TableCell>
                      <TableCell className="p-6">
                        <Badge className={`border-none font-black text-[10px] px-2.5 py-1 flex items-center w-fit gap-1 ${
                          item.status === 'RETURNED_ON_TIME' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          <CheckCircle2 size={12} />
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
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
