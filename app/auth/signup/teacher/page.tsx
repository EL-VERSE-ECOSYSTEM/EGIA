'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from 'lucide-react'

export default function TeacherSignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-t-4 border-purple-500 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-purple-100 p-3 rounded-full w-fit mb-4">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Teacher Registration</CardTitle>
          <CardDescription>
            Join our academic staff. Staff code required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staffCode">Staff Verification Code</Label>
              <Input id="staffCode" placeholder="Enter code provided by admin" required className="bg-purple-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Jane" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Smith" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" placeholder="jane.smith@elgoodnews.edu.ng" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 font-bold py-6">
              Register as Staff
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">
            Already registered? <Link href="/auth/signin" className="text-purple-600 font-bold hover:underline">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
