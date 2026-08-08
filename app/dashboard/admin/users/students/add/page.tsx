'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createStudent } from '@/app/actions/admin'
import { studentEnrollmentSchema, type StudentEnrollmentData } from '@/lib/validators/student.schema'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function AddStudentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentEnrollmentData>({
    resolver: zodResolver(studentEnrollmentSchema),
    defaultValues: { email: '', admissionNumber: '', gender: 'MALE', academicSession: '2026/2027', term: 'First Term' },
  })

  const onSubmit = async (formData: StudentEnrollmentData) => {
    try {
      await createStudent(formData)
      toast.success('Student profile created and enrolled successfully!')
      router.push('/dashboard/admin/users/students/list')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to create student.')
    }
  }

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-5xl mx-auto space-y-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Institutional Enrollment</h1>
          <p className="text-slate-500 font-medium text-lg text-pretty">Enroll students for the current academic session. For parents without mobile devices, the admin creates the profile directly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200 rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="p-10 bg-amber-50/30 border-b border-amber-50">
              <CardTitle className="text-2xl font-black text-amber-900">Student Identity</CardTitle>
              <CardDescription>Primary details for the new student.</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              <form onSubmit={handleSubmit(onSubmit)} id="enroll-form" className="space-y-8" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">First Name</Label>
                    <Input
                      {...register('firstName')}
                      className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600"
                    />
                    {errors.firstName && <p className="text-xs font-bold text-red-600">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Last Name</Label>
                    <Input
                      {...register('lastName')}
                      className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600"
                    />
                    {errors.lastName && <p className="text-xs font-bold text-red-600">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Guardian Email (Optional)</Label>
                    <Input
                      type="email"
                      {...register('email')}
                      placeholder="parent@example.com"
                      className="h-14 rounded-2xl bg-slate-50 border-none focus:bg-white focus:ring-amber-600"
                    />
                    {errors.email && <p className="text-xs font-bold text-red-600">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Admission Number</Label>
                    <Input
                      {...register('admissionNumber')}
                      placeholder="EGIA-S-XXXXXX or EGIA-P-XXXXXX"
                      className="h-14 rounded-2xl bg-slate-50 border-none font-black tracking-widest focus:bg-white focus:ring-amber-600"
                    />
                    {errors.admissionNumber && <p className="text-xs font-bold text-red-600">{errors.admissionNumber.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Gender</Label>
                    <select {...register('gender')} className="h-14 w-full rounded-2xl bg-slate-50 px-3 font-black"><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Level</Label>
                    <select {...register('class')} defaultValue="" className="h-14 w-full rounded-2xl bg-slate-50 px-3 font-black"><option value="" disabled>Select Class</option><option value="Basic 5">Basic 5</option><option value="Basic 6">Basic 6</option><option value="JSS1">JSS 1</option><option value="JSS2">JSS 2</option><option value="JSS3">JSS 3</option><option value="SSS1">SSS 1</option><option value="SSS2">SSS 2</option><option value="SSS3">SSS 3</option></select>
                    {errors.class && <p className="text-xs font-bold text-red-600">{errors.class.message}</p>}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white">
              <CardHeader className="p-8 pb-4">
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Academic Context</CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Session</Label>
                    <select {...register('academicSession')} className="h-12 w-full rounded-xl bg-slate-50 px-3 font-bold"><option value="2026/2027">2026/2027</option><option value="2025/2026">2025/2026</option></select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Term</Label>
                    <select {...register('term')} className="h-12 w-full rounded-xl bg-slate-50 px-3 font-bold"><option value="First Term">First Term</option><option value="Second Term">Second Term</option><option value="Third Term">Third Term</option></select>
                 </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-none rounded-[2.5rem] p-8 text-white">
               <div className="flex items-start gap-4">
                  <ShieldCheck className="text-amber-500 w-8 h-8 shrink-0" />
                  <div className="space-y-6">
                     <div>
                        <p className="font-black text-lg">Verification Note</p>
                        <p className="text-sm text-slate-400 font-medium">This enrollment creates a permanent record in the school database. Ensure all information matches legal documents.</p>
                     </div>
                     <Button
                        type="submit"
                        form="enroll-form"
                        disabled={isSubmitting}
                        className="w-full h-16 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-lg shadow-xl shadow-amber-900/20"
                     >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : 'CONFIRM ENROLLMENT'}
                     </Button>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
