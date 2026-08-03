import React from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trophy, Award, Medal, Zap, Star, Flame, Sparkles, TrendingUp, Search } from 'lucide-react'
import { db } from '@/lib/db'
import { student, assessmentResult } from '@/lib/db/schema'
import { sql, eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  // Query top 20 students dynamically from database based on average scores
  let leaderboardData: any[] = []

  try {
    const list = await db.select({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      class: student.class,
      admissionNumber: student.admissionNumber,
      avatar: student.profileImage,
      avgScore: sql<string>`coalesce(avg(${assessmentResult.score}), 0.00)::numeric(5,2)`
    })
    .from(student)
    .leftJoin(assessmentResult, eq(student.id, assessmentResult.studentId))
    .groupBy(student.id)
    .orderBy(desc(sql`coalesce(avg(${assessmentResult.score}), 0)`))
    .limit(20)

    leaderboardData = list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      totalPoints: Math.round(parseFloat(item.avgScore))
    }))
  } catch (err) {
    console.warn('Leaderboard query failed:', err)
    leaderboardData = []
  }

  // Get medals for top 3
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-8 h-8 text-amber-500 fill-amber-300 animate-bounce" />
    if (rank === 2) return <Medal className="w-7 h-7 text-slate-400 fill-slate-200" />
    if (rank === 3) return <Medal className="w-7 h-7 text-amber-700 fill-amber-100" />
    return <span className="font-black text-slate-400 text-lg w-7 text-center">{rank}</span>
  }

  return (
    <DashboardLayout role="student">
      <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-12 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy size={300} strokeWidth={1} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-amber-400 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Assessment rankings
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Academy Leaderboard</h1>
            <p className="text-slate-300 text-lg font-medium max-w-xl">
              Rankings are calculated from completed CBT assessment results.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Card className="bg-white/10 border-white/15 text-white p-6 rounded-3xl">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Weekend competition</p>
              <p className="text-lg font-black mt-1">Published competitions appear here.</p>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Top 20 Leaderboard List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Academy Top 20</h2>
                <p className="text-slate-500 font-medium mt-1">First 20 best students ranked dynamically by average assessment score.</p>
              </div>
            </div>

            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardContent className="p-0">
                {leaderboardData.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {leaderboardData.map((item) => (
                      <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center gap-6">
                          <div className="w-10 flex items-center justify-center shrink-0">
                            {getMedalIcon(item.rank)}
                          </div>
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-xl text-indigo-600 shadow-inner shrink-0 uppercase overflow-hidden">
                            {item.avatar ? (
                              <img src={item.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span>{item.firstName[0]}{item.lastName[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-lg leading-tight group-hover:text-indigo-900 transition-colors">
                              {item.firstName} {item.lastName}
                            </p>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {item.class} • {item.admissionNumber}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 text-right shrink-0">
                          <div>
                            <p className="font-black text-indigo-600 text-xl leading-none font-mono">
                              {item.totalPoints}%
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              Average score
                            </p>
                          </div>
                          <div>
                            <p className="font-black text-emerald-600 text-lg font-mono">
                              {item.avgScore}%
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              Avg Score
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 font-black">
                    No leaderboard information is currently available. Please check back once students have completed assessments.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panels */}
          <div className="space-y-8">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                  <Zap className="text-amber-500 w-5 h-5" /> Competition updates
                </CardTitle>
                <CardDescription className="text-slate-400 font-bold">No unpublished or sample challenges are displayed.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <p className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-500 font-medium">There are no published weekend competitions at this time.</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
