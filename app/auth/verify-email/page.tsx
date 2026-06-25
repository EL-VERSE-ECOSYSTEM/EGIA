import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <Card className="max-w-md w-full border-none shadow-2xl shadow-slate-200 rounded-3xl overflow-hidden text-center">
        <div className="h-2 bg-amber-600 w-full" />
        <CardHeader className="pt-12">
          <div className="mx-auto bg-amber-100 p-6 rounded-full w-fit mb-6 animate-pulse">
            <Mail className="w-12 h-12 text-amber-600" />
          </div>
          <CardTitle className="text-3xl font-black text-slate-900">Check Your Email</CardTitle>
          <CardDescription className="text-slate-500 font-medium mt-4 text-lg">
            We've sent a verification link to your email address.
            Please click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12 space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-500 font-medium">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </div>
          <Link href="/auth/signin">
            <Button variant="ghost" className="text-amber-600 font-black">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
