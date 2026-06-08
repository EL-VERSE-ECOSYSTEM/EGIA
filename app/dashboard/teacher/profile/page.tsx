'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Settings,
  Calendar,
  Award
} from 'lucide-react'

// Define Award icon locally if missing from lucide-react exports in some versions
const AwardIcon = Award || (({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>
))

export default function TeacherProfilePage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800">My Profile</h1>
        <p className="text-slate-600">Academic staff profile and teaching schedule.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-purple-200">
            <div className="h-24 bg-purple-600"></div>
            <CardContent className="pt-0 -mt-12 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden mx-auto shadow-lg">
                <User className="w-12 h-12 text-slate-300" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Mr. Samuel Okoro</h2>
              <p className="text-sm text-slate-500">ID: STAFF/2024/042</p>
              <div className="mt-4 space-y-2">
                <Badge className="w-full justify-center bg-purple-100 text-purple-800 border-purple-200">Mathematics Lead</Badge>
                <Badge className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200">Senior Staff</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AwardIcon className="w-4 h-4 text-purple-600" /> Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Average Class Pass Rate</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full w-[88%]"></div>
                </div>
                <p className="text-right text-xs font-bold mt-1 text-purple-700">88%</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Punctuality Score</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[95%]"></div>
                </div>
                <p className="text-right text-xs font-bold mt-1 text-emerald-700">95%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Academic background and specialization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    B.Sc. Ed. Mathematics
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    Further Mathematics & Physics
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    8 Years
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Joined Academy</Label>
                  <p className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    September 2018
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned Classes & Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { class: 'JSS 3A', subject: 'Mathematics', students: 45 },
                  { class: 'SSS 1B', subject: 'Further Mathematics', students: 32 },
                  { class: 'SSS 3A', subject: 'Mathematics', students: 38 }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{item.class}</p>
                      <p className="text-sm text-slate-500">{item.subject}</p>
                    </div>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">{item.students} Students</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline">Print Staff ID</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 font-bold px-8">Edit Profile</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
