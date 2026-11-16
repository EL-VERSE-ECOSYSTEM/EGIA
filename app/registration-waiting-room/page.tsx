import { redirect } from 'next/navigation'
import { Clock3, CreditCard, FileCheck2, ShieldCheck } from 'lucide-react'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolRegistrationApplication } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { WaitingRoomRefresh } from './refresh'

export const dynamic = 'force-dynamic'

export default async function RegistrationWaitingRoomPage() {
  const session = await auth.getSession()
  if (!session?.user) redirect('/auth/signin')

  const application = await db.query.schoolRegistrationApplication.findFirst({
    where: eq(schoolRegistrationApplication.applicantEmail, session.user.email.trim().toLowerCase()),
    columns: {
      schoolName: true,
      paymentStatus: true,
      documentVerificationStatus: true,
      approvalStatus: true,
      rejectionReason: true,
    },
  })
  if (!application) redirect('/dashboard-redirect')
  if (application.approvalStatus === 'APPROVED') redirect('/dashboard-redirect')

  const stages = [
    { title: 'Registration payment', value: application.paymentStatus, done: application.paymentStatus === 'SUCCESS', icon: CreditCard },
    { title: 'Proof of address review', value: application.documentVerificationStatus, done: application.documentVerificationStatus === 'VERIFIED', icon: FileCheck2 },
    { title: 'School approval', value: application.approvalStatus.replaceAll('_', ' '), done: false, icon: ShieldCheck },
  ]

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-5 text-white">
      <section className="w-full max-w-2xl space-y-7 rounded-3xl border border-slate-800 bg-slate-900 p-7 shadow-2xl sm:p-10">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-300"><Clock3 className="size-8" /></div>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Registration status</p>
          <h1 className="mt-2 text-3xl font-black">Your school is in the waiting room</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">{application.schoolName} is not approved yet. Dashboard access will open automatically after the required reviews are complete.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {stages.map(({ title, value, done, icon: Icon }) => (
            <div key={title} className={`rounded-2xl border p-4 ${done ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-700 bg-slate-950'}`}>
              <Icon className={`size-5 ${done ? 'text-emerald-400' : 'text-amber-300'}`} />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
              <p className={`mt-1 text-sm font-black ${done ? 'text-emerald-300' : 'text-white'}`}>{value}</p>
            </div>
          ))}
        </div>
        {application.rejectionReason && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">Review note: {application.rejectionReason}</p>}
        <p className="text-center text-xs text-slate-400">This page checks for status changes every few seconds. You can safely sign out and return later.</p>
        <WaitingRoomRefresh email={session.user.email} />
        <div className="text-center"><a href="/auth/signin" className="text-sm font-semibold text-blue-300 hover:text-blue-200">Sign out or use another account</a></div>
      </section>
    </main>
  )
}
