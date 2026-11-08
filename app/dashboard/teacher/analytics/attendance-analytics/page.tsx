import DashboardLayout from '@/components/layout/dashboard-layout'
import { getTeacherAnalytics } from '@/app/actions/analytics'

export const dynamic = 'force-dynamic'

export default async function AttendanceAnalyticsPage() {
  const analytics = await getTeacherAnalytics()

  return (
    <DashboardLayout role="teacher">
      <main className="mx-auto min-h-full w-full max-w-7xl space-y-6 p-4 sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase text-amber-800">Teaching analytics</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Attendance analytics</h1>
          <p className="mt-1 text-sm text-slate-600">Attendance recorded for your assigned classes.</p>
        </header>

        {analytics.classes.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-600">
            No assigned classes are available for attendance reporting.
          </p>
        ) : (
          <section aria-label="Class attendance rates" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {analytics.classes.map((item) => {
              const rate = Math.max(0, Math.min(100, item.attendanceRate))
              return (
                <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-semibold text-slate-900">{item.name}</h2>
                    <span className="text-sm font-bold tabular-nums text-slate-900">{rate.toFixed(1)}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${item.name} attendance rate`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(rate)}
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div className="h-full rounded-full bg-amber-600" style={{ width: `${rate}%` }} />
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </main>
    </DashboardLayout>
  )
}
