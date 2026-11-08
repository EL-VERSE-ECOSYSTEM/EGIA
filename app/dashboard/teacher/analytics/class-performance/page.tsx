import DashboardLayout from '@/components/layout/dashboard-layout'
import { getTeacherAnalytics } from '@/app/actions/analytics'

export const dynamic = 'force-dynamic'

export default async function ClassPerformancePage() {
  const analytics = await getTeacherAnalytics()

  return (
    <DashboardLayout role="teacher">
      <main className="mx-auto min-h-full w-full max-w-7xl space-y-6 p-4 sm:p-8">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold uppercase text-cyan-800">Teaching analytics</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Class performance</h1>
          <p className="mt-1 text-sm text-slate-600">Assessment results for classes assigned to you.</p>
        </header>

        {analytics.classes.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-600">
            No classes are assigned to your teacher profile yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <tr>
                  <th scope="col" className="px-4 py-3 sm:px-6">Class</th>
                  <th scope="col" className="px-4 py-3">Students</th>
                  <th scope="col" className="px-4 py-3">Submissions</th>
                  <th scope="col" className="px-4 py-3">Average</th>
                  <th scope="col" className="px-4 py-3 sm:px-6">Pass rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {analytics.classes.map((item) => (
                  <tr key={item.id}>
                    <th scope="row" className="px-4 py-4 font-semibold text-slate-900 sm:px-6">{item.name}</th>
                    <td className="px-4 py-4 tabular-nums text-slate-700">{item.students}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-700">{item.submissions}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-700">{item.submissions ? `${item.averageScore.toFixed(1)}%` : 'No results'}</td>
                    <td className="px-4 py-4 tabular-nums text-slate-700 sm:px-6">{item.submissions ? `${item.passRate.toFixed(1)}%` : 'No results'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}