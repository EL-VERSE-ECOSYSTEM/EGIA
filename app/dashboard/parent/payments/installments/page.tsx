import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, Calendar, CheckCircle2, AlertCircle, ArrowRight, CreditCard } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { payment, paymentInstallment, parent as parentTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function InstallmentsPage() {
  const session = await auth.getSession()

  const parentProfile = session?.user?.id ? await db.query.parent.findFirst({
    where: eq(parentTable.userId, session.user.id)
  }) : null

  const installments = parentProfile ? await db.query.paymentInstallment.findMany({
    where: eq(paymentInstallment.status, 'pending'), // Simplified for view
    with: {
       payment: {
         with: {
           student: true
         }
       }
    },
    orderBy: (pi, { asc }) => [asc(pi.dueDate)]
  }) : []

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Installment Plans</h1>
            <p className="text-slate-500 font-medium text-lg">Manage your flexible 10-12 installment payment schedule.</p>
          </div>
          <div className="bg-emerald-600 px-8 py-4 rounded-[2rem] text-white shadow-xl shadow-emerald-100 flex items-center gap-4">
             <Wallet size={32} />
             <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Next Due Date</p>
                <p className="text-xl font-black">Oct 15, 2024</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
           {installments.length === 0 ? (
             <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] p-20 text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200 mx-auto mb-8">
                   <CreditCard size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No Active Payment Plans</h3>
                <p className="text-slate-500 font-medium mb-8">You haven't initialized any installment plans for this term yet.</p>
                <Button className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-xl shadow-emerald-200">
                   SETUP PAYMENT PLAN
                </Button>
             </Card>
           ) : (
             <Card className="border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                   <CardTitle className="text-2xl font-black text-slate-900">Current Installments</CardTitle>
                   <Badge className="bg-emerald-100 text-emerald-700 h-10 px-6 rounded-xl font-black text-xs uppercase tracking-widest">ACTIVE PLAN</Badge>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50">
                             <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No.</th>
                             <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Beneficiary</th>
                             <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                             <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</th>
                             <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                             <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {installments.map(inst => (
                             <tr key={inst.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="p-8 font-black text-slate-400">#{inst.installmentNumber}</td>
                                <td className="p-8">
                                   <p className="font-black text-slate-900">{inst.payment?.student?.firstName} {inst.payment?.student?.lastName}</p>
                                </td>
                                <td className="p-8 font-black text-slate-900">₦{Number(inst.amount).toLocaleString()}</td>
                                <td className="p-8">
                                   <div className="flex items-center gap-2 font-bold text-slate-600">
                                      <Calendar size={14} className="text-slate-400" /> {inst.dueDate}
                                   </div>
                                </td>
                                <td className="p-8">
                                   {inst.status === 'paid' ? (
                                      <Badge className="bg-emerald-100 text-emerald-700 border-none font-black px-4 gap-1">
                                         <CheckCircle2 size={12} /> PAID
                                      </Badge>
                                   ) : inst.status === 'overdue' ? (
                                      <Badge className="bg-red-100 text-red-700 border-none font-black px-4 gap-1">
                                         <AlertCircle size={12} /> OVERDUE
                                      </Badge>
                                   ) : (
                                      <Badge className="bg-amber-100 text-amber-700 border-none font-black px-4">PENDING</Badge>
                                   )}
                                </td>
                                <td className="p-8 text-right">
                                   {inst.status !== 'paid' && (
                                     <Button className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-xs shadow-lg shadow-emerald-100 gap-2">
                                        PAY NOW <ArrowRight size={14} />
                                     </Button>
                                   )}
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                   </div>
                </CardContent>
             </Card>
           )}
        </div>
      </div>
    </DashboardLayout>
  )
}
