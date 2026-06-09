'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users } from 'lucide-react'

export default function ParentSignUpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-t-4 border-emerald-500 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-emerald-100 p-3 rounded-full w-fit mb-4">
            <Users className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Parent Registration</CardTitle>
          <CardDescription>
            Create an account to monitor your children's progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="john.doe@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+234..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" required />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold py-6">
              Create Parent Account
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link href="/auth/signin" className="text-emerald-600 font-bold hover:underline">Sign In</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
