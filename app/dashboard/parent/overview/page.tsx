export const dynamic = "force-dynamic"
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  Wallet,
  Plus
} from 'lucide-react'
import { getParentDashboardData, getParentProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function ParentOverviewPage() {
  const session = await auth.getSession()
  const parentProfile = await getParentProfile(session?.user.id || '')
  const dashboardData = await getParentDashboardData(parentProfile?.id || '')
  const { children, totalPendingAmount, recentMessages } = dashboardData

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Users size={300} strokeWidth={1} />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-emerald-400 text-xs font-black uppercase tracking-widest mb-6">
                  <ShieldCheck className="w-3.5 h-3.5" /> Parent Portal
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Welcome, {parentProfile?.firstName || 'Parent'}.</h1>
               <p className="text-slate-400 text-lg font-medium max-w-xl">
                  You are currently monitoring {children.length} wards.
                  Check performance, pay fees, and stay updated with school announcements.
               </p>
            </div>
            <div className="flex gap-4">
               <Link href="/dashboard/parent/payments/make-payment">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-8 rounded-2xl font-black shadow-xl shadow-emerald-600/20">
                     <Wallet className="mr-2 w-5 h-5" /> MAKE PAYMENT
                  </Button>
               </Link>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-slate-900">Your Children</h2>
               <Link href="/dashboard/parent/children/link">
                  <Button variant="ghost" className="font-black text-emerald-600 hover:bg-emerald-50">LINK NEW CHILD <Plus className="ml-2 w-4 h-4" /></Button>
               </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {children.length > 0 ? children.map((child) => (
                 <Card key={child.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-0">
                       <div className="p-10 space-y-6">
                          <div className="flex items-center gap-6">
                             <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner uppercase">
                                {child.firstName[0]}{child.lastName[0]}
                             </div>
                             <div>
                                <p className="text-2xl font-black text-slate-900">{child.firstName} {child.lastName}</p>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{child.class} • {child.admissionNumber}</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-2xl bg-slate-50 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-sm font-black text-slate-900">ACTIVE</p>
                             </div>
                             <div className="p-4 rounded-2xl bg-slate-50 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admission</p>
                                <p className="text-sm font-black text-slate-900">{child.admissionNumber}</p>
                             </div>
                          </div>
                       </div>
                       <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
                          <Link href={`/dashboard/parent/children/${child.id}/results`} className="flex-1">
                             <Button variant="outline" className="w-full rounded-xl font-bold border-white bg-white shadow-sm">RESULTS</Button>
                          </Link>
                          <Link href={`/dashboard/parent/children/${child.id}`} className="flex-1">
                             <Button variant="outline" className="w-full rounded-xl font-bold border-white bg-white shadow-sm">PROFILE</Button>
                          </Link>
                       </div>
                    </CardContent>
                 </Card>
               )) : (
                 <div className="col-span-2 py-20 bg-white rounded-[2.5rem] text-center text-slate-400 border-2 border-dashed border-slate-100">
                    <p className="font-black text-lg">No wards linked to this account yet.</p>
                    <p className="text-sm font-medium mt-2">Use the button above to link your child using their admission number.</p>
                 </div>
               )}
            </div>
         </div>

         <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                     <CreditCard className="text-emerald-600 w-5 h-5" /> Pending Fees
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-4">
                  <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100">
                     <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Unverified / Pending Amount</p>
                     <p className="text-3xl font-black text-emerald-900">₦{totalPendingAmount.toLocaleString()}.00</p>
                     <p className="text-xs font-bold text-emerald-600 mt-2">Check history for details</p>
                  </div>
                  <Link href="/dashboard/parent/payments/make-payment">
                     <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/10">PAY NOW</Button>
                  </Link>
               </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                     <MessageSquare className="text-blue-600 w-5 h-5" /> Recent Messages
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-4">
                  {recentMessages.length > 0 ? recentMessages.map((m, i) => (
                    <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">
                          {m.sender?.name?.[0] || 'U'}
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-sm font-black text-slate-900 truncate">{m.sender?.name || 'User'}</p>
                          <p className="text-xs text-slate-500 font-medium truncate">{m.content}</p>
                       </div>
                    </div>
                  )) : (
                    <p className="text-xs text-center text-slate-400 font-medium py-4">No recent messages.</p>
                  )}
                  <Link href="/dashboard/parent/communication/messages">
                     <Button variant="ghost" className="w-full text-blue-600 font-black text-xs uppercase tracking-widest mt-2">VIEW INBOX</Button>
                  </Link>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  )
}
