'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap } from 'lucide-react'

export default function StudentSignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-t-4 border-orange-500 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-orange-100 p-3 rounded-full w-fit mb-4">
            <GraduationCap className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Student Activation</CardTitle>
          <CardDescription>
            Activate your account using your Admission Number
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission Number</Label>
              <Input id="admissionNumber" placeholder="EGIA/2024/001" required className="bg-orange-50 uppercase" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Preferred Email</Label>
              <Input id="email" type="email" placeholder="student@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Set Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 font-bold py-6">
              Activate My Account
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">
            Need help? Contact school admin or <Link href="/auth/signin" className="text-orange-600 font-bold hover:underline">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
