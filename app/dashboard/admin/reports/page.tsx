'use client'

import React from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  PieChart,
  Activity,
  Award,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function AdminReportsHubPage() {
  const reportSections = [
    {
      title: 'Academic Reports',
      description: 'Track academic benchmarks, grades performance distribution, attendance, and transcripts.',
      badge: 'Academics',
      badgeColor: 'bg-blue-100 text-blue-800',
      items: [
        { name: 'Grade Performance Analytics', href: '/dashboard/admin/reports/academic/performance', icon: Award },
        { name: 'Attendance Summary Logs', href: '/dashboard/admin/reports/academic/attendance-summary', icon: Calendar },
        { name: 'Teacher & Staff Evaluations', href: '/dashboard/admin/reports/academic/teacher-evaluation', icon: UserCheck },
        { name: 'Student Academic Transcripts', href: '/dashboard/admin/reports/academic/transcripts', icon: FileText },
      ]
    },
    {
      title: 'Financial Reports',
      description: 'Review fee collections, pending bills, debtors aged schedules, and terminal cash flow statement logs.',
      badge: 'Finance',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      items: [
        { name: 'Fee Collection Metrics', href: '/dashboard/admin/reports/financial/fee-collection', icon: TrendingUp },
        { name: 'Cash Flow Analysis Ledger', href: '/dashboard/admin/reports/financial/cash-flow', icon: PieChart },
        { name: 'Aged Debtors Schedule', href: '/dashboard/admin/reports/financial/aged-debtors', icon: Clock },
      ]
    },
    {
      title: 'Custom Reports Builder',
      description: 'Construct custom data tables, run specific queries across schemas, and access saved report builder configs.',
      badge: 'Ad-hoc Queries',
      badgeColor: 'bg-purple-100 text-purple-800',
      items: [
        { name: 'Saved Custom Reports', href: '/dashboard/admin/reports/custom/saved', icon: Layers },
        { name: 'Interactive Report Builder', href: '/dashboard/admin/reports/custom/builder', icon: BarChart3 },
      ]
    }
  ]

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Institutional Analytics & Reports</h1>
          <p className="text-slate-500 font-medium text-lg">
            Access secure statistical registries, evaluate class rankings, monitor terminal collection summaries, and build custom SQL metrics.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {reportSections.map((sec, idx) => (
            <Card key={idx} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden flex flex-col justify-between">
              <CardContent className="p-8 space-y-6 flex-1">
                <div className="flex justify-between items-center">
                  <Badge className={`border-none font-black text-[9px] px-3 py-1 tracking-wider uppercase ${sec.badgeColor}`}>
                    {sec.badge}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{sec.title}</h3>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed mt-2">{sec.description}</p>
                </div>

                <div className="space-y-2 pt-2">
                  {sec.items.map((item, itemIdx) => (
                    <Link key={itemIdx} href={item.href} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-50 group/item transition-colors">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-slate-400 group-hover/item:text-amber-500 transition-colors" />
                        <span className="text-xs font-black text-slate-700">{item.name}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover/item:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
