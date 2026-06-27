import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, MapPin, Calendar, FileText, TrendingUp, AlertCircle } from 'lucide-react'
import { getStudentFullProfile } from '@/app/actions/teacher'

export default async function TeacherStudentProfilePage({ params }: { params: { id: string } }) {
  const s = await getStudentFullProfile(params.id)

  if (!s) return <div>Student not found</div>

  return (
    <DashboardLayout role="teacher">
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-8 mb-8">
           <div className="w-32 h-32 rounded-[2.5rem] bg-purple-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-purple-200">
              {s.firstName[0]}{s.lastName[0]}
           </div>
           <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{s.firstName} {s.lastName}</h1>
              <div className="flex gap-4 mt-2">
                 <Badge className="bg-purple-100 text-purple-700 border-none font-black">{s.class}</Badge>
                 <Badge variant="outline" className="text-slate-400 border-slate-200 font-bold uppercase tracking-widest text-[10px]">{s.admissionNumber}</Badge>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: Contact Info */}
           <div className="space-y-8">
              <Card className="border-none shadow-xl shadow-slate-200 rounded-[2.5rem]">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Guardian Contact</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-0 space-y-6">
                    <div className="flex items-center gap-4">
                       <User size={20} className="text-purple-600" />
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</p>
                          <p className="font-bold text-slate-900">{s.parent?.firstName} {s.parent?.lastName}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <Phone size={20} className="text-purple-600" />
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone</p>
                          <p className="font-bold text-slate-900">{s.parent?.phoneNumber}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <Mail size={20} className="text-purple-600" />
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</p>
                          <p className="font-bold text-slate-900">{s.parent?.user?.email}</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200 rounded-[2.5rem] bg-slate-900 text-white">
                 <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                       <p className="text-sm font-black uppercase tracking-widest text-slate-400">Payment Status</p>
                       <Badge className="bg-emerald-500 text-white border-none font-black">UP TO DATE</Badge>
                    </div>
                    <div>
                       <p className="text-xs text-slate-400 font-medium">Term Fees (2024/2025)</p>
                       <p className="text-2xl font-black">₦150,000 / ₦150,000</p>
                    </div>
                 </CardContent>
              </Card>
           </div>

           {/* Middle & Right: Academic Records */}
           <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="border-none shadow-xl shadow-slate-200 rounded-[2.5rem]">
                    <CardHeader className="p-8">
                       <CardTitle className="text-slate-900 font-black flex items-center gap-2"><TrendingUp size={20} className="text-purple-600" /> Academic Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                       <div className="text-5xl font-black text-purple-600 mb-2">92%</div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class Percentile: Top 5%</p>
                    </CardContent>
                 </Card>
                 <Card className="border-none shadow-xl shadow-slate-200 rounded-[2.5rem]">
                    <CardHeader className="p-8">
                       <CardTitle className="text-slate-900 font-black flex items-center gap-2"><Calendar size={20} className="text-purple-600" /> Attendance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                       <div className="text-5xl font-black text-emerald-600 mb-2">98%</div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status: Excellent</p>
                    </CardContent>
                 </Card>
              </div>

              <Card className="border-none shadow-xl shadow-slate-200 rounded-[2.5rem]">
                 <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-black text-slate-900">Term Assessment History</CardTitle>
                    <FileText className="text-slate-200" size={32} />
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50/50">
                             <tr>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Score</th>
                                <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {s.results?.map(r => (
                                <tr key={r.id}>
                                   <td className="p-8 font-black text-slate-900">{r.assessment?.title}</td>
                                   <td className="p-8 text-xs font-bold text-slate-500">{r.assessment?.type}</td>
                                   <td className="p-8 font-black text-purple-600">{r.score}%</td>
                                   <td className="p-8"><Badge className="bg-emerald-100 text-emerald-700 border-none font-black">PASSED</Badge></td>
                                </tr>
                             ))}
                             {(!s.results || s.results.length === 0) && (
                                <tr><td colSpan={4} className="p-12 text-center text-slate-400 font-bold italic">No academic records for current term.</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200 rounded-[2.5rem] bg-red-50/30">
                 <CardHeader className="p-8">
                    <CardTitle className="text-red-900 font-black flex items-center gap-2"><AlertCircle size={20} className="text-red-600" /> Disciplinary Records</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-0">
                    <p className="text-sm text-red-700 font-medium">No disciplinary cases recorded in this academic session.</p>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
