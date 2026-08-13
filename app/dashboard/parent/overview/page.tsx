export const dynamic = "force-dynamic"
import React from 'react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  CreditCard,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Activity,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react'
import { getParentChildren, getParentProfile } from '@/lib/api/queries'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { checkWeeklyPaymentStatus } from '@/app/actions/adult-education'
import { getParentPaymentHistory } from '@/app/actions/payments'
import { GraduationCap, Video, BookOpen, AlertTriangle } from 'lucide-react'

export default async function ParentOverviewPage() {
  const session = await auth.getSession()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const parentProfile = await getParentProfile(session.user.id)
  if (!parentProfile || session.user.role?.toUpperCase() !== 'PARENT') {
    redirect('/dashboard-redirect')
  }

  const children = await getParentChildren(parentProfile.id)

  // Check Adult Education enrollment status
  let adultStatus = { enrolled: false, isPaid: false }
  try {
    adultStatus = await checkWeeklyPaymentStatus()
  } catch (err) {
    // Parent profile might not be fully loaded or new
  }

  // Calculate dynamic outstanding pending fees
  let pendingAmount = 0
  try {
    const parentPayments = await getParentPaymentHistory()
    pendingAmount = parentPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)
  } catch (err) {
    console.warn('Failed to fetch parent payment history for overview:', err)
  }

  return (
    <DashboardLayout role="parent">
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
               <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Children</h2>
               <Link href="/dashboard/parent/children/link">
                 <Button variant="ghost" className="font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800">
                   LINK NEW CHILD <Plus className="ml-2 w-4 h-4" />
                 </Button>
               </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {children.length > 0 ? children.map((child) => (
                 <Card key={child.id} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-0">
                       <div className="p-10 space-y-6">
                          <div className="flex items-center gap-6">
                             <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-400 dark:text-slate-300 shadow-inner">
                                {child.firstName[0]}{child.lastName[0]}
                             </div>
                             <div>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{child.firstName} {child.lastName}</p>
                                <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{child.class} • {child.admissionNumber}</p>
                             </div>
                          </div>

                          <div className="p-4 bg-orange-50/50 dark:bg-slate-850 border border-orange-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 space-y-1.5">
                             <p><span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-wider block">Birth Certificate Name</span> <span className="font-black text-slate-900 dark:text-white text-sm">{child.firstName} {child.middleName || ''} {child.lastName}</span></p>
                             <p><span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-wider block">Date of Birth</span> <span className="font-black text-slate-800 dark:text-slate-200">{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}</span></p>
                             <p><span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] font-black tracking-wider block">Parent Contact Info</span> <span className="font-semibold text-slate-600 dark:text-slate-400">Email: {session?.user?.email || 'N/A'} | Phone: {parentProfile?.phoneNumber || 'N/A'}</span></p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Average</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">78.5%</p>
                             </div>
                             <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center">
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Attendance</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">92%</p>
                             </div>
                          </div>
                       </div>
                       <div className="p-6 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3">
                          <Link href={`/dashboard/parent/children/${child.id}/results`} className="flex-1">
                             <Button variant="outline" className="w-full rounded-xl font-bold border-white dark:border-slate-800 bg-white dark:bg-slate-800 dark:text-white shadow-sm">RESULTS</Button>
                          </Link>
                          <Link href={`/dashboard/parent/children/${child.id}/profile`} className="flex-1">
                             <Button variant="outline" className="w-full rounded-xl font-bold border-white dark:border-slate-800 bg-white dark:bg-slate-800 dark:text-white shadow-sm">PROFILE</Button>
                          </Link>
                       </div>
                    </CardContent>
                 </Card>
               )) : (
                 <div className="col-span-2 py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <p className="font-black text-lg">No wards linked to this account yet.</p>
                    <p className="text-sm font-medium mt-2">Use the button above to link your child using their admission number.</p>
                 </div>
               )}
            </div>
         </div>

         <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden">
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                     <CreditCard className="text-emerald-600 w-5 h-5" /> Pending Fees
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-4">
                  <div className="p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                     <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Current Balance</p>
                     <p className="text-3xl font-black text-emerald-900 dark:text-emerald-300">
                        ₦{pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                     </p>
                     <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 mt-2">Due Date: Dec 15, 2025</p>
                  </div>
                  <Link href="/dashboard/parent/payments/make-payment" className="block w-full">
                     <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/10">PAY NOW</Button>
                  </Link>
                  <div className="text-center pt-1">
                    <a
                      href="https://checkout.korapay.com/pay/BHba4zdsceZDgyW"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline tracking-widest uppercase block"
                    >
                      Or Pay Directly via Korapay Link
                    </a>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900">
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                     <MessageSquare className="text-blue-600 w-5 h-5" /> Recent Messages
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-4">
                  {[
                    { from: "School Admin", msg: "Termly newsletter is out...", time: "1h ago" },
                    { from: "Mrs. Smith", msg: "Regarding John's science project...", time: "Yesterday" }
                  ].map((m, i) => (
                    <div key={i} className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                       <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">
                          {m.from[0]}
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate">{m.from}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{m.msg}</p>
                       </div>
                    </div>
                  ))}
                  <Link href="/dashboard/parent/communication/messages" className="block w-full">
                     <Button variant="ghost" className="w-full text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest mt-2">VIEW INBOX</Button>
                  </Link>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
