import DashboardLayout from '@/components/layout/dashboard-layout'
import { getTeacherAnalytics } from '@/app/actions/analytics'

export const dynamic = 'force-dynamic'

export default async function StudentGrowthPage() {
  const analytics = await getTeacherAnalytics()
  const maxScore = Math.max(100, ...analytics.growth.map(point => point.averageScore))

  return (
    <DashboardLayout role="teacher">
      <main className="mx-auto min-h-full w-full max-w-7xl space-y-6 p-4 sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase text-emerald-800">Teaching analytics</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Student growth</h1>
          <p className="mt-1 text-sm text-slate-600">Monthly average assessment scores for your classes.</p>
        </header>

        {analytics.growth.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-600">
            Growth trends will appear after students submit your assessments.
          </p>
        ) : (
          <section aria-label="Monthly assessment score trend" className="space-y-3">
            {analytics.growth.map((point) => {
              const score = Math.max(0, Math.min(100, point.averageScore))
              const width = Math.max(0, Math.min(100, (score / maxScore) * 100))
              const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
                .format(new Date(`${point.month}-01T00:00:00Z`))
              return (
                <article key={point.month} className="grid grid-cols-[7rem_minmax(0,1fr)_6rem] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-4 sm:grid-cols-[10rem_minmax(0,1fr)_8rem] sm:px-5">
                  <h2 className="text-sm font-semibold text-slate-800">{monthLabel}</h2>
                  <div
                    role="progressbar"
                    aria-label={`${monthLabel} average score`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(score)}
                    className="h-3 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div className="h-full rounded-full bg-cyan-700" style={{ width: `${width}%` }} />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-slate-900">{score.toFixed(1)}%</p>
                    <p className="text-xs tabular-nums text-slate-600">{point.submissions} submissions</p>
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
