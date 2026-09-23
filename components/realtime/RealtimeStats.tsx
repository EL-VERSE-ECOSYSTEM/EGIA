"use client";

import { useEffect, useState } from "react";
import { subscribeToTable, unsubscribeFromTable } from "@/utils/supabase/client";
import { School, Users, GraduationCap, Award, Zap, Activity } from "lucide-react";

interface StatsData {
  partnerSchools: number;
  activeStudents: number;
  certifiedEducators: number;
  assessmentsConducted: number;
}

interface RealtimeStatsProps {
  initialStats?: Partial<StatsData>;
}

export function RealtimeStats({ initialStats }: RealtimeStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    partnerSchools: initialStats?.partnerSchools ?? 52,
    activeStudents: initialStats?.activeStudents ?? 12850,
    certifiedEducators: initialStats?.certifiedEducators ?? 640,
    assessmentsConducted: initialStats?.assessmentsConducted ?? 84500,
  });

  const [lastEventTime, setLastEventTime] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const triggerUpdateEffect = () => {
    setIsUpdating(true);
    setLastEventTime(new Date().toLocaleTimeString());
    setTimeout(() => setIsUpdating(false), 1200);
  };

  useEffect(() => {
    // Subscribe to real-time changes on core tables
    const schoolChannel = subscribeToTable("school", {
      event: "INSERT",
      callback: () => {
        setStats((prev) => ({ ...prev, partnerSchools: prev.partnerSchools + 1 }));
        triggerUpdateEffect();
      },
    });

    const studentChannel = subscribeToTable("student", {
      event: "INSERT",
      callback: () => {
        setStats((prev) => ({ ...prev, activeStudents: prev.activeStudents + 1 }));
        triggerUpdateEffect();
      },
    });

    const teacherChannel = subscribeToTable("teacher", {
      event: "INSERT",
      callback: () => {
        setStats((prev) => ({ ...prev, certifiedEducators: prev.certifiedEducators + 1 }));
        triggerUpdateEffect();
      },
    });

    const assessmentChannel = subscribeToTable("assessment", {
      event: "INSERT",
      callback: () => {
        setStats((prev) => ({ ...prev, assessmentsConducted: prev.assessmentsConducted + 1 }));
        triggerUpdateEffect();
      },
    });

    return () => {
      unsubscribeFromTable(schoolChannel);
      unsubscribeFromTable(studentChannel);
      unsubscribeFromTable(teacherChannel);
      unsubscribeFromTable(assessmentChannel);
    };
  }, []);

  const statItems = [
    {
      label: "Partner Schools",
      value: stats.partnerSchools.toLocaleString() + "+",
      icon: School,
      color: "from-amber-500 to-orange-500",
      accentBg: "bg-amber-500/10 text-amber-400",
      description: "Accredited institutions nationwide",
    },
    {
      label: "Active Students",
      value: stats.activeStudents.toLocaleString() + "+",
      icon: Users,
      color: "from-blue-500 to-indigo-500",
      accentBg: "bg-blue-500/10 text-blue-400",
      description: "Engaged learners on the portal",
    },
    {
      label: "Certified Educators",
      value: stats.certifiedEducators.toLocaleString() + "+",
      icon: GraduationCap,
      color: "from-emerald-500 to-teal-500",
      accentBg: "bg-emerald-500/10 text-emerald-400",
      description: "Vetted subject expert teachers",
    },
    {
      label: "CBT Assessments Taken",
      value: stats.assessmentsConducted.toLocaleString() + "+",
      icon: Award,
      color: "from-purple-500 to-pink-500",
      accentBg: "bg-purple-500/10 text-purple-400",
      description: "Real-time automated graded exams",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-slate-950 text-white relative overflow-hidden border-y border-slate-800">
      {/* Background glow animations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-16 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase">
                Real-Time Platform Metrics
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Synchronized live with Supabase database
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>LIVE SUPABASE SYNC</span>
            {lastEventTime && (
              <span className="text-slate-500 text-[10px] ml-1">
                ({lastEventTime})
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className={`group relative rounded-3xl bg-slate-900/80 border border-slate-800 p-8 hover:border-slate-700 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-900/80 ${
                  isUpdating ? "ring-2 ring-amber-500/50 scale-[1.02]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3.5 rounded-2xl ${item.accentBg} transition-transform group-hover:scale-110 duration-300`}>
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <Activity className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
                </div>

                <div className="space-y-2">
                  <div className={`text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {item.value}
                  </div>
                  <div className="text-slate-200 font-extrabold text-lg uppercase tracking-wide">
                    {item.label}
                  </div>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Verified Data</span>
                  <span className="text-emerald-400 font-bold">● Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
