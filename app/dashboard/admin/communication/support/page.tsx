'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Filter, MessageSquare, LifeBuoy, Clock, User } from 'lucide-react'

export default function AdminSupportDashboard() {
  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Support Tickets</h1>
            <p className="text-slate-500 font-medium text-lg">Manage technical support requests from students, teachers, and parents.</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-blue-100 px-6 py-4 rounded-2xl flex items-center gap-3">
                <LifeBuoy className="text-blue-600" />
                <div className="leading-none">
                   <p className="text-2xl font-black text-blue-700">8</p>
                   <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Open Tickets</p>
                </div>
             </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input className="pl-12 h-14 rounded-2xl bg-white border-none font-medium shadow-sm" placeholder="Search tickets..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl h-14 border-2 font-bold px-6">All Categories</Button>
                <Button variant="outline" className="rounded-xl h-14 border-2 font-bold px-6">Priority: High</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Activity</th>
                         <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {[1,2,3,4].map(i => (
                         <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                            <td className="p-8">
                               <p className="font-black text-slate-900 group-hover:text-blue-600">SUP-20240625-000{i}</p>
                               <p className="text-[10px] font-bold text-slate-400">Mobile app crash during CBT</p>
                            </td>
                            <td className="p-8">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                     <User size={16} />
                                  </div>
                                  <div>
                                     <p className="font-bold text-slate-700 text-sm">Chinedu Okafor</p>
                                     <p className="text-[10px] font-black text-orange-500 uppercase">Student</p>
                                  </div>
                               </div>
                            </td>
                            <td className="p-8">
                               <Badge className="bg-slate-100 text-slate-600 border-none font-bold px-3">TECHNICAL</Badge>
                            </td>
                            <td className="p-8">
                               <div className="flex items-center gap-2 text-slate-400">
                                  <Clock size={14} />
                                  <span className="text-[10px] font-bold">15 mins ago</span>
                               </div>
                            </td>
                            <td className="p-8 text-right">
                               <Button className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 font-black text-xs gap-2 shadow-lg shadow-blue-100">
                                  RESPOND <MessageSquare size={14} />
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
