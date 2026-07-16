'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, GraduationCap, ChevronRight, UserPlus, Heart, Search, ArrowUpDown } from 'lucide-react'
import { getLinkedChildren } from '@/app/actions/user'
import Link from 'next/link'

const CLASS_ORDER: Record<string, number> = {
  'Primary 1': 1, 'Primary 2': 2, 'Primary 3': 3, 'Primary 4': 4, 'Primary 5': 5, 'Primary 6': 6,
  'JSS 1': 7, 'JSS 2': 8, 'JSS 3': 9,
  'SSS 1': 10, 'SSS 2': 11, 'SSS 3': 12
}

function getClassValue(className: string): number {
  return CLASS_ORDER[className] || 99
}

export default function MyChildrenPage() {
  const [children, setChildren] = useState<any[]>([])
  const [filteredChildren, setFilteredChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Sorting State
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'CLASS_ASC' | 'CLASS_DESC' | 'NAME_ASC'>('CLASS_ASC')

  useEffect(() => {
    async function load() {
      const data = await getLinkedChildren()
      setChildren(data || [])
      setFilteredChildren(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Search and Sort side-effect
  useEffect(() => {
    let result = [...children]

    // 1. Search filter (by name or admission number)
    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase()
      result = result.filter(c =>
        c.firstName.toLowerCase().includes(lower) ||
        c.lastName.toLowerCase().includes(lower) ||
        (c.admissionNumber || '').toLowerCase().includes(lower)
      )
    }

    // 2. Class sorting hierarchy
    result.sort((a, b) => {
      if (sortOrder === 'CLASS_ASC') {
        const diff = getClassValue(a.class) - getClassValue(b.class)
        if (diff !== 0) return diff
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      } else if (sortOrder === 'CLASS_DESC') {
        const diff = getClassValue(b.class) - getClassValue(a.class)
        if (diff !== 0) return diff
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      } else {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
      }
    })

    setFilteredChildren(result)
  }, [searchTerm, sortOrder, children])

  return (
    <DashboardLayout role="parent">
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Wards</h1>
            <p className="text-slate-500 font-medium text-lg">Connected student profiles for monitoring and support.</p>
          </div>
          <div className="flex gap-4">
             <Link href="/dashboard/parent/children/link">
                <Button variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black text-slate-600 gap-2 shadow-sm">
                   <UserPlus size={18} /> LINK ACCOUNT
                </Button>
             </Link>
             <Link href="/dashboard/parent/children/enroll">
                <Button className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-xl shadow-emerald-200 gap-2">
                   <Plus size={20} /> NEW ENROLLMENT
                </Button>
             </Link>
          </div>
        </div>

        {/* Search & Sort Panel */}
        {children.length > 0 && (
          <Card className="border-none shadow-xl rounded-[2rem] bg-white p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search ward by name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-slate-100 bg-slate-50 font-bold focus:bg-white focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <ArrowUpDown className="text-emerald-600 w-5 h-5 hidden sm:block" />
                <Select value={sortOrder} onValueChange={(val: any) => setSortOrder(val || 'CLASS_ASC')}>
                  <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-12 text-xs font-black min-w-[200px] w-full sm:w-auto">
                    <SelectValue placeholder="Sort Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLASS_ASC">Class Level (Primary → Secondary)</SelectItem>
                    <SelectItem value="CLASS_DESC">Class Level (Secondary → Primary)</SelectItem>
                    <SelectItem value="NAME_ASC">Student Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="py-40 text-center text-slate-400 font-bold italic">Syncing with school database...</div>
        ) : children.length === 0 ? (
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[3rem] bg-white p-20 text-center space-y-8">
             <div className="mx-auto w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                <Heart size={48} />
             </div>
             <div className="space-y-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Start Your Journey</h2>
                <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                   No children are currently linked to your portal. Use 'New Enrollment' for new students or 'Link Account' if your child is already registered.
                </p>
             </div>
             <Link href="/dashboard/parent/children/enroll" className="inline-block">
                <Button className="h-16 px-10 rounded-2xl bg-emerald-600 font-black text-lg">ENROLL NOW</Button>
             </Link>
          </Card>
        ) : filteredChildren.length === 0 ? (
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-12 text-center text-slate-400 font-bold italic">
            No wards match your search filter.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             {filteredChildren.map((child) => (
               <Card key={child.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-0">
                     <div className="p-10 space-y-8">
                        <div className="flex items-center gap-6">
                           <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 shadow-inner group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors duration-500">
                              {child.firstName[0]}{child.lastName[0]}
                           </div>
                           <div>
                              <p className="text-2xl font-black text-slate-900 tracking-tight">{child.firstName} {child.lastName}</p>
                              <Badge className="bg-emerald-50 text-emerald-700 border-none font-black px-4 py-1 mt-2 uppercase tracking-widest text-[10px]">{child.class}</Badge>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group-hover:border-emerald-100 transition-colors">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admission No</p>
                              <p className="text-lg font-black text-slate-700 font-mono">{child.admissionNumber}</p>
                           </div>
                           <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 group-hover:border-emerald-100 transition-colors">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                              <p className="text-lg font-black text-emerald-600">ENROLLED</p>
                           </div>
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between gap-3 px-10">
                        <Link href="/dashboard/parent/results/report-card" className="flex-1">
                          <Button variant="outline" className="w-full h-12 rounded-xl font-black border-white bg-white shadow-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all uppercase tracking-widest text-[10px]">RESULTS</Button>
                        </Link>
                        <Button variant="outline" className="flex-1 h-12 rounded-xl font-black border-white bg-white shadow-sm hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all uppercase tracking-widest text-[10px]">ATTENDANCE</Button>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
