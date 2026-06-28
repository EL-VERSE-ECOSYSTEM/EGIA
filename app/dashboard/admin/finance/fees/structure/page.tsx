'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { setFees } from '@/app/actions/admin'
import { Wallet, Plus, Trash2, Save, Layers } from 'lucide-react'

export default function FeesStructurePage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    class: '',
    department: '',
    feeType: 'Tuition Fees',
    amount: '',
    dueDate: ''
  })

  const classes = ['Basic 5', 'Basic 6', 'JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']
  const departments = ['Science', 'Art', 'Commercial']
  const feeTypes = ['Tuition Fees', 'Development Levy', 'Examination Fees', 'Sports Fees', 'PTA Levies', 'Library Fees', 'ICT Fees', 'Uniform Fees']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await setFees(formData)
      alert('Fee structure updated successfully!')
      setFormData({ ...formData, amount: '', dueDate: '' })
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Financial Architecture</h1>
          <p className="text-slate-500 font-medium text-lg">Define fee structures per class and department for the academy.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="p-10 border-b border-slate-50">
                 <CardTitle className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Plus className="text-amber-600" /> New Fee Configuration
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-10">
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Class Level</Label>
                          <Select value={formData.class} onValueChange={(v) => setFormData({...formData, class: v})}>
                             <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                                <SelectValue placeholder="Select Class" />
                             </SelectTrigger>
                             <SelectContent>
                                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department (Optional)</Label>
                          <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                             <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                                <SelectValue placeholder="General / All" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="GENERAL">General / All</SelectItem>
                                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Fee Category</Label>
                          <Select value={formData.feeType} onValueChange={(v) => setFormData({...formData, feeType: v})}>
                             <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                {feeTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount (₦)</Label>
                          <Input
                            type="number"
                            required
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            className="h-14 rounded-2xl bg-slate-50 border-none font-black text-lg"
                          />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Standard Due Date</Label>
                       <Input
                         type="date"
                         required
                         value={formData.dueDate}
                         onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                         className="h-14 rounded-2xl bg-slate-50 border-none font-bold"
                       />
                    </div>

                    <Button
                      disabled={loading}
                      className="w-full h-16 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-lg shadow-xl shadow-amber-200 gap-2"
                    >
                       <Save size={20} /> {loading ? 'SAVING...' : 'PUBLISH FEE STRUCTURE'}
                    </Button>
                 </form>
              </CardContent>
           </Card>

           <div className="space-y-8">
              <Card className="border-none shadow-xl shadow-slate-100 rounded-[2.5rem] bg-slate-900 text-white p-10">
                 <div className="space-y-6">
                    <Layers className="text-amber-500 w-10 h-10" />
                    <div>
                       <h3 className="text-2xl font-black mb-2">Automated Billing</h3>
                       <p className="text-sm text-slate-400 font-medium">New fee structures are automatically applied to all matching students. Parents will receive immediate notification.</p>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
