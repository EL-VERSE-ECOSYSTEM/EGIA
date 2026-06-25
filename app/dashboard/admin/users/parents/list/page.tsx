'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, UserCheck, ShieldCheck, Mail, Phone } from 'lucide-react'
import { getAllParents } from '@/app/actions/admin'
import { Input } from '@/components/ui/input'

export default function ParentListPage() {
  const [parents, setParents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getAllParents()
      setParents(data)
      setIsLoading(false)
    }
    load()
  }, [])

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Guardian Directory</h1>
            <p className="text-slate-500 font-medium text-lg">Manage parent/guardian records and their linked wards.</p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-600 text-amber-950 h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-amber-200">
             <Plus className="w-6 h-6 mr-2" /> Add Guardian
          </Button>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-slate-50">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input className="pl-12 h-12 rounded-2xl bg-slate-50 border-none font-medium" placeholder="Search parents..." />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50">
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Guardian Name</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Wards</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Relationship</th>
                         <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                         [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="p-10 bg-slate-50/50 border-b" /></tr>)
                      ) : parents.map((p) => (
                         <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-6">
                               <p className="font-black text-slate-900">{p.firstName} {p.lastName}</p>
                               <p className="text-[10px] text-slate-400">PARENT-{p.id.substring(0,8).toUpperCase()}</p>
                            </td>
                            <td className="p-6 space-y-1">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                  <Mail className="w-3 h-3 text-slate-400" /> {p.user?.email}
                               </div>
                               <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Phone className="w-3 h-3 text-slate-400" /> {p.phoneNumber || 'No Phone'}
                               </div>
                            </td>
                            <td className="p-6">
                               <Badge className="bg-blue-100 text-blue-600 border-none px-3 font-black text-[10px]">
                                  {p.students?.length || 0} Linked
                               </Badge>
                            </td>
                            <td className="p-6">
                               <span className="text-xs font-black text-slate-600 uppercase">{p.relationship || 'Guardian'}</span>
                            </td>
                            <td className="p-6 text-right">
                               <Button variant="ghost" size="sm" className="font-black text-amber-600">View Profile</Button>
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
