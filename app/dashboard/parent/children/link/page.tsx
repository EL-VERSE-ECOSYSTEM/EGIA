'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { UserPlus, Search, CheckCircle2, AlertCircle } from 'lucide-react'

export default function LinkChildPage() {
  const [admissionNumber, setAdmissionNumber] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundStudent, setFoundStudent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)
    setError(null)
    setFoundStudent(null)

    // Simulate API call
    setTimeout(() => {
      if (admissionNumber === 'EGIA/2024/001') {
        setFoundStudent({
          id: '1',
          name: 'Divine Goodnews',
          class: 'JSS 3A',
          gender: 'Male'
        })
      } else {
        setError('Student with this admission number not found. Please verify and try again.')
      }
      setIsSearching(false)
    }, 1000)
  }

  const handleLink = async () => {
    // Simulate linking
    setSuccess(true)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-800">Link Child Account</h1>
        <p className="text-slate-600">Enter your child's admission number to connect their profile to your parent account.</p>
      </div>

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Find Student
          </CardTitle>
          <CardDescription>
            You can find the admission number on your child's ID card or admission letter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admissionNumber">Admission Number</Label>
              <div className="flex gap-2">
                <Input
                  id="admissionNumber"
                  placeholder="EGIA/2024/000"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
                  required
                  className="uppercase"
                />
                <Button type="submit" disabled={isSearching} className="bg-emerald-600 hover:bg-emerald-700">
                  {isSearching ? 'Searching...' : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {foundStudent && !success && (
            <div className="mt-8 p-6 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-lg font-bold text-emerald-900 mb-4">Student Found!</h3>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between border-b border-emerald-200 pb-2">
                  <span className="text-emerald-700">Name:</span>
                  <span className="font-semibold">{foundStudent.name}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-200 pb-2">
                  <span className="text-emerald-700">Class:</span>
                  <span className="font-semibold">{foundStudent.class}</span>
                </div>
                <div className="flex justify-between border-b border-emerald-200 pb-2">
                  <span className="text-emerald-700">Gender:</span>
                  <span className="font-semibold">{foundStudent.gender}</span>
                </div>
              </div>
              <Button onClick={handleLink} className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-lg font-bold">
                Confirm & Link Account
              </Button>
            </div>
          )}

          {success && (
            <Alert className="mt-6 bg-green-50 border-green-200 text-green-800">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="font-bold">Successfully Linked!</AlertTitle>
              <AlertDescription>
                Divine Goodnews has been linked to your account. You can now view their results and pay their fees.
              </AlertDescription>
              <div className="mt-4">
                <Button asChild variant="outline" className="border-green-600 text-green-700 hover:bg-green-100">
                  <Link href="/dashboard/parent/children">View My Children</Link>
                </Button>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
