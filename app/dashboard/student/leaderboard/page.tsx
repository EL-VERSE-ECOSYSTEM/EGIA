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
      totalPoints: Math.floor(parseFloat(item.avgScore) * 10 + (20 - idx) * 15), // Custom points weight
      streak: 5 - (idx % 3)
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
              <Sparkles className="w-3.5 h-3.5" /> Weekend Challenges
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Weekend 2 Hours Battle</h1>
            <p className="text-slate-300 text-lg font-medium max-w-xl">
              Complete interactive mini-games, logic challenges, and weekend CBT run-throughs to earn points and climb the academy rankings!
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            <Card className="bg-white/10 border-white/15 text-white p-6 rounded-3xl">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Next Live Battle</p>
              <p className="text-2xl font-black mt-1">Saturday, 2:00 PM</p>
              <p className="text-xs text-slate-300 font-medium mt-1">Active for exactly 2 hours • ₦5,000 cash prizes</p>
              <Button size="sm" className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs h-10">
                SET REMINDER <Zap className="w-3.5 h-3.5 ml-1.5" />
              </Button>
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
                              {item.totalPoints.toLocaleString()}
                            </p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              Academy Pts
                            </p>
                          </div>
                          <div>
                            <Badge className="bg-orange-100 text-orange-800 border-none font-black text-xs px-3 py-1 flex items-center gap-1 rounded-lg">
                              <Flame className="w-3.5 h-3.5 text-orange-600" /> {item.streak}
                            </Badge>
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
            {/* Weekend Challenges */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                  <Zap className="text-amber-500 w-5 h-5" /> Weekend Quests
                </CardTitle>
                <CardDescription className="text-slate-400 font-bold">Earn instant streak points</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {[
                  { title: "Arithmetic Speed Run", desc: "Solve 20 arithmetic equations under 60 seconds.", points: "+150 pts", active: true },
                  { title: "Vocabulary Scramble", desc: "Unscramble academic terminologies and spell words.", points: "+120 pts", active: true },
                  { title: "Science Logic Maze", desc: "Navigate chemistry and physics structures.", points: "+200 pts", active: false }
                ].map((q, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-start gap-4">
                    <div>
                      <p className="font-black text-slate-900 text-sm leading-tight">{q.title}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{q.desc}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-600 font-mono tracking-widest uppercase">{q.points}</span>
                        <span className="text-slate-300">•</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${q.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {q.active ? 'Active Now' : 'Unlocked Sat'}
                        </span>
                      </div>
                    </div>
                    {q.active && (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 rounded-lg text-xs px-3">
                        PLAY
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Streak & Rank Summary */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-8 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-10 text-white">
                <Trophy size={180} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-200">Your Current Rank</span>
                  <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase px-2.5 py-1">WEEKLY</Badge>
                </div>

                <div className="flex gap-4 items-baseline">
                  <span className="text-5xl font-black tracking-tighter">#4</span>
                  <span className="text-sm font-bold text-indigo-200">out of 342 pupils</span>
                </div>

                <div className="h-[1px] bg-white/15" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Next Reward Tier</p>
                    <p className="font-black text-sm text-white mt-1">#3 Gold Badge</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Streak Points</p>
                    <p className="font-black text-sm text-white mt-1">2,140 Pts</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
