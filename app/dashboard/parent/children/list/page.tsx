'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, GraduationCap, ChevronRight, UserPlus, Heart } from 'lucide-react'
import { getLinkedChildren } from '@/app/actions/user'
import Link from 'next/link'

export default function MyChildrenPage() {
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getLinkedChildren()
      setChildren(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Wards</h1>
            <p className="text-slate-500 font-medium text-lg">Connected student profiles for monitoring and support.</p>
          </div>
          <div className="flex gap-4">
             <Link href="/dashboard/parent/children/link">
                <Button variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black text-slate-600 gap-2 shadow-sm">
                   <UserPlus size={18} /> LINK ACCOUNT
                </Button>
             </Link>
             <Link href="/dashboard/parent/children/enroll">
                <Button className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-xl shadow-emerald-200 gap-2">
                   <Plus size={20} /> NEW ENROLLMENT
                </Button>
             </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center text-slate-400 font-bold italic">Syncing with school database...</div>
        ) : children.length === 0 ? (
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[3rem] bg-white p-20 text-center space-y-8">
             <div className="mx-auto w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                <Heart size={48} />
             </div>
             <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Start Your Journey</h2>
                <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                   No children are currently linked to your portal. Use 'New Enrollment' for new students or 'Link Account' if your child is already registered.
                </p>
             </div>
             <Link href="/dashboard/parent/children/enroll" className="inline-block">
                <Button className="h-16 px-10 rounded-2xl bg-emerald-600 font-black text-lg">ENROLL NOW</Button>
             </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {children.map((child) => (
               <Card key={child.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-0">
                     <div className="p-10 space-y-8">
                        <div className="flex items-center gap-6">
                           <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors duration-500">
                              {child.firstName[0]}{child.lastName[0]}
                           </div>
                           <div>
                              <p className="text-2xl font-black text-slate-900 tracking-tight">{child.firstName} {child.lastName}</p>
                              <Badge className="bg-emerald-50 text-emerald-700 border-none font-black px-4 py-1 mt-2 uppercase tracking-widest text-[10px]">{child.class}</Badge>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group-hover:border-emerald-100 transition-colors">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admission No</p>
                              <p className="text-lg font-black text-slate-700 font-mono">{child.admissionNumber}</p>
                           </div>
                           <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group-hover:border-emerald-100 transition-colors">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                              <p className="text-lg font-black text-emerald-600">ENROLLED</p>
                           </div>
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between gap-3 px-10">
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-black border-white bg-white shadow-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all uppercase tracking-widest text-[10px]">RESULTS</Button>
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-black border-white bg-white shadow-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all uppercase tracking-widest text-[10px]">ATTENDANCE</Button>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
