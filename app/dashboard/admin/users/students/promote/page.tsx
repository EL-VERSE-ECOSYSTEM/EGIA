'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, GraduationCap, AlertCircle, Search } from 'lucide-react'
import { getAllStudents, processBulkPromotion } from '@/app/actions/admin'

export default function StudentPromotionPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [targetClass, setTargetClass] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPromoting, setIsPromoting] = useState(false)

  useEffect(() => {
    async function load() {
      const data = await getAllStudents()
      setStudents(data)
      setIsLoading(false)
    }
    load()
  }, [])

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handlePromote = async () => {
    if (selectedStudents.length === 0 || !targetClass) {
      alert('Please select students and a target class')
      return
    }

    if (!confirm(`Are you sure you want to promote ${selectedStudents.length} students to ${targetClass}?`)) return

    setIsPromoting(true)
    try {
      await processBulkPromotion({ studentIds: selectedStudents, targetClass })
      alert('Students promoted successfully!')
      setSelectedStudents([])
      // Refresh list
      const data = await getAllStudents()
      setStudents(data)
    } catch (error) {
      console.error(error)
      alert('Failed to promote students.')
    } finally {
      setIsPromoting(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Student Promotion</h1>
            <p className="text-slate-500 font-medium text-lg">Batch promote students to the next academic level.</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
             <AlertCircle className="text-amber-600 w-5 h-5" />
             <p className="text-xs font-bold text-amber-800 leading-tight">
               Promotion Criteria: 50% average, max 2 failures, &lt;20 absences.
             </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3">
            <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-slate-50">
                 <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-black">Eligible Students</CardTitle>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-4">{selectedStudents.length} Selected</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest w-10">
                           <Checkbox checked={selectedStudents.length === students.length} onCheckedChange={(val) => val ? setSelectedStudents(students.map(s => s.id)) : setSelectedStudents([])} />
                        </th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Current Class</th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Avg. Score</th>
                        <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {isLoading ? (
                         <tr><td colSpan={5} className="p-20 text-center text-slate-400 italic">Loading student database...</td></tr>
                       ) : students.map((s) => (
                         <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-6">
                               <Checkbox checked={selectedStudents.includes(s.id)} onCheckedChange={() => toggleStudent(s.id)} />
                            </td>
                            <td className="p-6">
                               <p className="font-black text-slate-900">{s.firstName} {s.lastName}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase">{s.admissionNumber}</p>
                            </td>
                            <td className="p-6 font-bold text-slate-600">{s.class}</td>
                            <td className="p-6 font-black text-emerald-600">68.5%</td>
                            <td className="p-6">
                               <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 font-black text-[10px] uppercase">Eligible</Badge>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card className="border-none shadow-xl shadow-slate-100 rounded-[2rem] bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <GraduationCap className="w-32 h-32" />
                </div>
                <CardHeader className="p-8 pb-4">
                   <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-400">Action Center</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6 relative z-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Class</label>
                      <Select onValueChange={setTargetClass}>
                         <SelectTrigger className="bg-white/10 border-white/10 h-12 rounded-xl text-white">
                            <SelectValue placeholder="Select Destination" />
                         </SelectTrigger>
                         <SelectContent className="bg-slate-900 border-slate-800 text-white">
                            <SelectItem value="JSS2">JSS 2</SelectItem>
                            <SelectItem value="JSS3">JSS 3</SelectItem>
                            <SelectItem value="SSS1">SSS 1</SelectItem>
                            <SelectItem value="SSS2">SSS 2</SelectItem>
                            <SelectItem value="SSS3">SSS 3</SelectItem>
                            <SelectItem value="GRADUATED">Graduated</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>

                   <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex justify-between text-xs mb-2">
                         <span className="text-slate-400">Total Selected</span>
                         <span className="font-bold">{selectedStudents.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                         <span className="text-slate-400">Target</span>
                         <span className="font-bold text-amber-400">{targetClass || '---'}</span>
                      </div>
                   </div>

                   <Button
                    onClick={handlePromote}
                    disabled={isPromoting || selectedStudents.length === 0}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-amber-950 h-16 rounded-2xl font-black text-lg transition-all"
                   >
                     {isPromoting ? 'Processing...' : 'Confirm Promotion'} <ArrowRight className="ml-2 w-5 h-5" />
                   </Button>
                </CardContent>
             </Card>

             <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <h3 className="font-black text-slate-900 mb-2">Bulk Action Policy</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Promotion actions are permanent and will update student records across all termly results and dashboards.
                </p>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
