import Link from 'next/link'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { getTeacherAnalytics } from '@/app/actions/analytics'

export const dynamic = 'force-dynamic'

export default async function TeacherReportsPage() {
  const analytics = await getTeacherAnalytics()

  return (
    <DashboardLayout role="teacher">
      <main className="mx-auto min-h-full w-full max-w-7xl space-y-6 p-4 sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase text-cyan-800">Teaching analytics</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Reports</h1>
          <p className="mt-1 text-sm text-slate-600">Aggregate results from your assessments and assigned classes.</p>
        </header>

        <section aria-label="Teacher report totals" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: 'Assessments', value: analytics.totalAssessments },
            { label: 'Published', value: analytics.publishedAssessments },
            { label: 'Submissions', value: analytics.subjects.reduce((sum, item) => sum + item.submissions, 0) },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3" aria-labelledby="subject-report-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="subject-report-heading" className="text-lg font-bold text-slate-950">Subject summaries</h2>
              <p className="text-sm text-slate-600">Only assessments you created are included.</p>
            </div>
            <Link href="/dashboard/teacher/analytics/subject-performance" className="text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline">
              Subject performance
            </Link>
          </div>
          {analytics.subjects.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">Reports will appear after you create assessments and students submit results.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
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
                  {analytics.subjects.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="px-4 py-4 font-semibold text-slate-900 sm:px-6">{item.name}</th>
                      <td className="px-4 py-4 tabular-nums text-slate-700">{item.assessments}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-700">{item.submissions}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-700 sm:px-6">{item.submissions ? `${item.averageScore.toFixed(1)}%` : 'No results'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3" aria-labelledby="class-report-heading">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="class-report-heading" className="text-lg font-bold text-slate-950">Assigned class summaries</h2>
              <p className="text-sm text-slate-600">Assessment and attendance metrics for classes assigned to you.</p>
            </div>
            <Link href="/dashboard/teacher/analytics/class-performance" className="text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline">
              Class performance
            </Link>
          </div>
          {analytics.classes.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-600">No classes are assigned to your teacher profile yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 sm:px-6">Class</th>
                    <th scope="col" className="px-4 py-3">Students</th>
                    <th scope="col" className="px-4 py-3">Average score</th>
                    <th scope="col" className="px-4 py-3 sm:px-6">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {analytics.classes.map((item) => (
                    <tr key={item.id}>
                      <th scope="row" className="px-4 py-4 font-semibold text-slate-900 sm:px-6">{item.name}</th>
                      <td className="px-4 py-4 tabular-nums text-slate-700">{item.students}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-700">{item.submissions ? `${item.averageScore.toFixed(1)}%` : 'No results'}</td>
                      <td className="px-4 py-4 tabular-nums text-slate-700 sm:px-6">{item.attendanceRate.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  )
}
