'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BookOpen, Calendar, XCircle, ArrowRight } from 'lucide-react'

export default function ParentLibraryReservationsPage() {
  const [reservations, setReservations] = useState([
    {
      id: 'resv-1',
      studentName: 'Chidi Obi',
      admissionNumber: 'EGIA/2023/048',
      title: 'Modern Biology for Senior Secondary Schools',
      isbn: 'ISBN-97812048',
      reservedAt: '2025-02-18',
      queuePosition: 2,
      status: 'WAITLISTED'
    },
    {
      id: 'resv-2',
      studentName: 'Chidi Obi',
      admissionNumber: 'EGIA/2023/048',
      title: 'WAEC Mathematics Past Questions & Solutions (2020 - 2025)',
      isbn: 'ISBN-97811223',
      reservedAt: '2025-02-20',
      queuePosition: 1,
      status: 'READY_FOR_PICKUP'
    }
  ])

  const handleCancelReservation = (id: string, title: string) => {
    if (confirm(`Are you sure you want to cancel the hold reservation for "${title}"?`)) {
      setReservations(reservations.filter(res => res.id !== id))
      alert('❌ Hold reservation cancelled successfully.')
    }
  }

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Book Hold Reservations</h1>
          <p className="text-slate-500 text-lg font-medium">
            Review and manage textbooks placed on high-priority standby queue lists for physical pickup.
          </p>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-10 pb-4">
            <CardTitle className="text-2xl font-black">Standby Hold Queue</CardTitle>
            <CardDescription className="font-bold text-slate-400">Track standby queues and pick-up notifications</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {reservations.length === 0 ? (
              <div className="p-24 text-center text-slate-400 italic font-bold">No active hold reservations.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Wards Details</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Book Title</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Reservation Date</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Queue Position</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest">Status</TableHead>
                    <TableHead className="p-6 font-black text-[10px] text-slate-400 uppercase tracking-widest text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-50">
                  {reservations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-6">
                        <p className="font-black text-slate-900 text-sm">{item.studentName}</p>
                        <p className="text-xs text-slate-400 font-bold">{item.admissionNumber}</p>
                      </TableCell>
                      <TableCell className="p-6">
                        <p className="font-black text-slate-900 text-sm line-clamp-1">{item.title}</p>
                        <p className="text-xs font-mono text-slate-400">{item.isbn}</p>
                      </TableCell>
                      <TableCell className="p-6 font-bold text-slate-500 text-sm">{item.reservedAt}</TableCell>
                      <TableCell className="p-6 font-black text-slate-900 text-sm">
                        {item.status === 'READY_FOR_PICKUP' ? '-' : `Queue #${item.queuePosition}`}
                      </TableCell>
                      <TableCell className="p-6">
                        <Badge className={`border-none font-black text-[10px] px-2.5 py-1 ${
                          item.status === 'READY_FOR_PICKUP' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-6 text-right">
                        {item.status === 'READY_FOR_PICKUP' ? (
                          <div className="text-xs text-green-600 font-black uppercase tracking-wider flex items-center justify-end gap-1">
                            Ready at Desk <ArrowRight size={14} />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelReservation(item.id, item.title)}
                            className="rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs"
                          >
                            <XCircle size={14} className="mr-1.5" /> Cancel hold
                          </Button>
                        )}
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
