import DashboardLayout from '@/components/layout/dashboard-layout'
import Link from 'next/link'
import { BookOpen, ChartNoAxesColumnIncreasing, ClipboardCheck } from 'lucide-react'
import { getTeacherAnalytics } from '@/app/actions/analytics'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function SubjectPerformancePage() {
  const analytics = await getTeacherAnalytics()
  const summary = [
    { label: 'Subjects assessed', value: analytics.subjects.length, icon: BookOpen, tone: 'text-cyan-800 bg-cyan-50' },
    { label: 'Assessments', value: analytics.totalAssessments, icon: ClipboardCheck, tone: 'text-amber-800 bg-amber-50' },
    { label: 'Average score', value: `${analytics.averageScore.toFixed(1)}%`, icon: ChartNoAxesColumnIncreasing, tone: 'text-emerald-800 bg-emerald-50' },
  ]

  return (
    <DashboardLayout role="teacher">
      <div className="mx-auto min-h-full w-full max-w-7xl space-y-6 p-4 sm:p-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-emerald-800">Teaching analytics</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950">Subject performance</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Assessment outcomes for subjects you teach at your school.
            </p>
          </div>
          <Link href="/dashboard/teacher/assessments/create">
            <Button className="min-h-10 w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto">
              Create assessment
            </Button>
          </Link>
        </header>

        <section aria-label="Performance summary" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {summary.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="flex min-h-24 items-center gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:rounded-lg sm:border sm:px-5">
              <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-slate-600">{label}</p>
                <p className="text-xl font-bold tabular-nums text-slate-950">{value}</p>
              </div>
            </div>
          ))}
        </section>

        <section aria-labelledby="subject-results-heading" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6">
            <h2 id="subject-results-heading" className="text-base font-bold text-slate-950">Results by subject</h2>
            <p className="mt-1 text-sm text-slate-600">Average score is calculated from submitted assessment results.</p>
          </div>

          {analytics.subjects.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpen className="mx-auto size-8 text-slate-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-800">No subject results yet</p>
              <p className="mt-1 text-sm text-slate-600">Create or publish an assessment to see student results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 sm:px-6">Subject</th>
                    <th scope="col" className="px-4 py-3">Assessments</th>
                    <th scope="col" className="px-4 py-3">Submissions</th>
                    <th scope="col" className="px-4 py-3 sm:px-6">Average score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {analytics.subjects.map((subject) => {
                    const score = Math.max(0, Math.min(100, subject.averageScore))
                    return (
                      <tr key={subject.id}>
                        <th scope="row" className="px-4 py-4 font-semibold text-slate-900 sm:px-6">{subject.name}</th>
                        <td className="px-4 py-4 tabular-nums text-slate-700">{subject.assessments}</td>
                        <td className="px-4 py-4 tabular-nums text-slate-700">{subject.submissions}</td>
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex min-w-40 items-center gap-3">
                            <div
                              role="progressbar"
                              aria-label={`${subject.name} average score`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={Math.round(score)}
                              className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                            >
                              <div className="h-full rounded-full bg-emerald-700" style={{ width: `${score}%` }} />
                            </div>
                            <span className="w-14 text-right font-semibold tabular-nums text-slate-900">
                              {subject.submissions ? `${score.toFixed(1)}%` : 'No results'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
