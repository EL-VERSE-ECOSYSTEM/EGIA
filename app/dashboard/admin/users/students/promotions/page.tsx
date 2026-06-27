'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraduationCap, ArrowRight, AlertCircle, Info } from 'lucide-react'
import { getEligibleStudents, promoteStudents } from '@/app/actions/admin'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function PromotionPage() {
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [targetClass, setTargetClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const classes = ['Basic 5', 'Basic 6', 'JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3', 'GRADUATED']

  useEffect(() => {
    async function load() {
      const data = await getEligibleStudents()
      setStudents(data)
      setLoading(false)
    }
    load()
  }, [])

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handlePromote = async () => {
    if (selectedStudents.length === 0 || !targetClass) return

    setProcessing(true)
    try {
      await promoteStudents(
        selectedStudents,
        targetClass,
        'End of Term Promotion',
        'Bulk promotion by admin'
      )
      // Refresh list
      const data = await getEligibleStudents()
      setStudents(data)
      setSelectedStudents([])
      setTargetClass('')
      alert('Students promoted successfully!')
    } catch (error) {
      console.error(error)
      alert('Failed to promote students.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Class Promotion</h1>
            <p className="text-slate-500 font-medium text-lg">Manage mass promotion of students to the next academic level.</p>
          </div>
          <GraduationCap size={48} className="text-amber-600 opacity-20" />
        </div>

        <Alert className="bg-amber-50 border-amber-200 rounded-[2rem] p-8">
          <Info className="h-6 w-6 text-amber-600" />
          <AlertTitle className="text-amber-900 font-black mb-2">PROMOTION CRITERIA NOTICE</AlertTitle>
          <AlertDescription className="text-amber-700 font-medium leading-relaxed">
            Standard promotion requires a 50% average and no more than 2 failures. Borderline cases should be reviewed manually before bulk action.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: Action Card */}
           <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] bg-white h-fit sticky top-8">
              <CardHeader className="p-10 border-b border-slate-50">
                <CardTitle className="text-2xl font-black text-slate-900">Promotion Control</CardTitle>
              </CardHeader>
              <CardContent className="p-10 space-y-8">
                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected Students</label>
                    <div className="text-3xl font-black text-amber-600">{selectedStudents.length}</div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Class Level</label>
                    <Select value={targetClass} onValueChange={setTargetClass}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900">
                        <SelectValue placeholder="Select target class" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {classes.map(c => <SelectItem key={c} value={c} className="font-bold py-3">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                 </div>

                 <Button
                   className="w-full h-16 rounded-[1.5rem] bg-amber-600 hover:bg-amber-700 font-black text-lg shadow-xl shadow-amber-200 gap-3 disabled:opacity-50"
                   disabled={selectedStudents.length === 0 || !targetClass || processing}
                   onClick={handlePromote}
                 >
                   {processing ? 'PROCESSING...' : (
                     <>CONFIRM PROMOTION <ArrowRight size={20} /></>
                   )}
                 </Button>
              </CardContent>
           </Card>

           {/* Right: Student Table */}
           <div className="lg:col-span-2">
              <Card className="border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
                 <CardContent className="p-0">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50">
                               <th className="p-8 w-12">
                                  <Checkbox
                                    checked={selectedStudents.length === students.length && students.length > 0}
                                    onCheckedChange={(checked) => {
                                      if (checked) setSelectedStudents(students.map(s => s.id))
                                      else setSelectedStudents([])
                                    }}
                                  />
                               </th>
                               <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                               <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Class</th>
                               <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">GPA / Performance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {loading ? (
                               <tr><td colSpan={4} className="p-24 text-center text-slate-400 italic font-bold">Fetching academic records...</td></tr>
                             ) : students.map(s => (
                               <tr key={s.id} className={`hover:bg-slate-50/30 transition-colors ${selectedStudents.includes(s.id) ? 'bg-amber-50/30' : ''}`}>
                                  <td className="p-8">
                                     <Checkbox
                                       checked={selectedStudents.includes(s.id)}
                                       onCheckedChange={() => toggleStudent(s.id)}
                                     />
                                  </td>
                                  <td className="p-8">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-sm">
                                           {s.firstName[0]}{s.lastName[0]}
                                        </div>
                                        <p className="font-black text-slate-900">{s.firstName} {s.lastName}</p>
                                     </div>
                                  </td>
                                  <td className="p-8">
                                     <Badge className="bg-slate-100 text-slate-600 border-none font-black">{s.class}</Badge>
                                  </td>
                                  <td className="p-8">
                                     <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                           <div className="h-full bg-amber-500 rounded-full" style={{ width: '75%' }}></div>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">75%</span>
                                     </div>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
