'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Lock,
  Bell
} from 'lucide-react'

export default function ParentProfilePage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-800">Account Settings</h1>
        <p className="text-slate-600">Manage your personal information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-emerald-600"></div>
            <CardContent className="pt-0 -mt-12 text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center overflow-hidden mx-auto">
                  <User className="w-12 h-12 text-slate-300" />
                </div>
                <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow-md">
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">John Goodnews</h2>
              <p className="text-sm text-slate-500">Parent / Guardian</p>
              <Badge className="mt-2 bg-emerald-100 text-emerald-800 border-emerald-200">Verified Parent</Badge>
            </CardContent>
          </Card>

          <nav className="space-y-1">
            <Button variant="ghost" className="w-full justify-start text-emerald-700 bg-emerald-50">
              <User className="w-4 h-4 mr-2" /> Personal Info
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Lock className="w-4 h-4 mr-2" /> Security
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Bell className="w-4 h-4 mr-2" /> Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-emerald-700 hover:bg-emerald-50">
              <Shield className="w-4 h-4 mr-2" /> Privacy
            </Button>
          </nav>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your contact details and home address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Goodnews" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex gap-2">
                    <Input id="email" defaultValue="john.goodnews@example.com" disabled />
                    <Button variant="outline" size="sm">Change</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+234 801 234 5678" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Home Address</Label>
                <textarea
                  id="address"
                  className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  defaultValue="123 School Avenue, Port Harcourt, Rivers State"
                ></textarea>
              </div>
              <div className="flex justify-end">
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Keep your account secure with a strong password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border shadow-sm">
                      <Lock className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Change Password</p>
                      <p className="text-sm text-slate-500">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <Button variant="outline">Update</Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border shadow-sm">
                      <Shield className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                      <p className="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Button className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none shadow-none">Enable</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
