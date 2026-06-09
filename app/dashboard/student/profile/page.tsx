'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Trophy,
  User,
  Settings,
  Mail,
  Smartphone
} from 'lucide-react'

export default function StudentProfilePage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-orange-800">My Profile</h1>
        <p className="text-slate-600">View and manage your academic profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-orange-200">
            <div className="h-24 bg-orange-500"></div>
            <CardContent className="pt-0 -mt-12 text-center">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden mx-auto shadow-lg">
                <User className="w-12 h-12 text-slate-300" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Divine Goodnews</h2>
              <p className="text-sm text-slate-500">Admission No: EGIA/2024/001</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">JSS 3A</Badge>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">Science</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-orange-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-600" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center" title="Top Perfomer">🥇</div>
                <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center" title="Perfect Attendance">📅</div>
                <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center" title="Math Whiz">🔢</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-orange-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <BookOpen className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Subjects</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Trophy className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Class Rank</p>
                  <p className="text-2xl font-bold">2nd / 45</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-100">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Attendance</p>
                  <p className="text-2xl font-bold">98.5%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Academic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Current Session</Label>
                  <p className="p-2 bg-slate-50 rounded border text-slate-700">2024 / 2025 Academic Session</p>
                </div>
                <div className="space-y-2">
                  <Label>Current Term</Label>
                  <p className="p-2 bg-slate-50 rounded border text-slate-700">First Term</p>
                </div>
                <div className="space-y-2">
                  <Label>Class Teacher</Label>
                  <p className="p-2 bg-slate-50 rounded border text-slate-700">Mr. Samuel Okoro</p>
                </div>
                <div className="space-y-2">
                  <Label>Assigned House</Label>
                  <p className="p-2 bg-slate-50 rounded border text-orange-700 font-bold">Yellow House (Sovereign)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-600" /> Account Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-slate-500">Receive alerts about new assignments and grades.</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">Enabled</Button>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-xs text-slate-500">Secure your student account with mobile verification.</p>
                  </div>
                  <Button variant="outline" size="sm">Setup</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
