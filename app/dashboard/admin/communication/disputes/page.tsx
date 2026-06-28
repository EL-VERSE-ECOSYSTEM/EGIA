'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Filter, MoreVertical, MessageSquare, AlertCircle, ShieldAlert } from 'lucide-react'

export default function AdminDisputesPage() {
  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Dispute Management</h1>
            <p className="text-slate-500 font-medium text-lg">System-wide oversight of all parent and student grievances.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-amber-100 px-6 py-4 rounded-2xl flex items-center gap-3">
                <AlertCircle className="text-amber-600" />
                <div className="leading-none">
                   <p className="text-2xl font-black text-amber-700">12</p>
                   <p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Active Disputes</p>
                </div>
             </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input className="pl-12 h-14 rounded-2xl bg-white border-none font-medium shadow-sm" placeholder="Search by Ticket ID, Student or Parent..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl h-14 border-2 font-bold px-6">Filter: All Status</Button>
                <Button variant="outline" className="rounded-xl h-14 border-2 font-bold px-6">Category: All</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket ID</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Raised By</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {[1,2,3,4,5].map(i => (
                         <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-8">
                               <p className="font-black text-slate-900">DSP-20240625-000{i}</p>
                               <p className="text-[10px] font-bold text-slate-400">24 Jun 2024</p>
                            </td>
                            <td className="p-8">
                               <p className="font-bold text-slate-700">Adesina Michael</p>
                               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Parent</p>
                            </td>
                            <td className="p-8">
                               <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold px-3">Payment Discrepancy</Badge>
                            </td>
                            <td className="p-8">
                               <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-red-500' : 'bg-amber-500'}`} />
                                  <span className={`text-[10px] font-black uppercase ${i === 1 ? 'text-red-600' : 'text-amber-600'}`}>{i === 1 ? 'URGENT' : 'MEDIUM'}</span>
                               </div>
                            </td>
                            <td className="p-8">
                               <Badge className="bg-amber-100 text-amber-700 border-none font-black px-4">UNDER REVIEW</Badge>
                            </td>
                            <td className="p-8 text-right">
                               <Button className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 font-black text-xs gap-2">
                                  MANAGE <MessageSquare size={14} />
                                </Button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
