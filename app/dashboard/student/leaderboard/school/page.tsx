import DashboardLayout from '@/components/layout/dashboard-layout'
import { getCompetitionLeaderboardsAction } from '@/app/actions/tournament'
import { Trophy } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SchoolLeaderboardPage() {
  const data = await getCompetitionLeaderboardsAction()
  return <DashboardLayout role="student"><main className="mx-auto max-w-5xl space-y-8 p-6 md:p-10"><Link href="/dashboard/student/leaderboard" className="text-sm font-bold text-indigo-700">← Global leaderboard</Link><header className="rounded-3xl bg-emerald-950 p-8 text-white"><p className="font-bold uppercase tracking-widest text-emerald-300">School · intraschool games</p><h1 className="mt-3 text-4xl font-black">School Leaderboard</h1><p className="mt-3 text-emerald-100">Students and pupils compete with learners from their own school. School games are open every day.</p></header><div className="overflow-hidden rounded-3xl border bg-white shadow-sm">{data.schoolLearners.length ? data.schoolLearners.map((learner: any) => <div key={learner.userId} className="flex items-center justify-between border-b p-5 last:border-0"><div className="flex items-center gap-4"><Trophy className={learner.rank <= 3 ? 'text-amber-500' : 'text-slate-300'}/><div><p className="font-bold">#{learner.rank} {learner.learnerName}</p><p className="text-sm text-slate-500">{learner.className} · {learner.games} games · {learner.wins} wins</p></div></div><strong className="text-xl text-emerald-700">{learner.points} pts</strong></div>) : <p className="p-8 text-center text-slate-500">No school game scores yet. Complete a game in the Learning Arena to appear here.</p>}</div><Link href="/dashboard/student/games" className="inline-flex rounded-xl bg-emerald-700 px-5 py-3 font-bold text-white">Play a school game</Link></main></DashboardLayout>
}
