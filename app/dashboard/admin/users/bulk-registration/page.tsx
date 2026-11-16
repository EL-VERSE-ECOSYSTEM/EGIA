'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { registerSchoolMembersInBulk, retrySchoolRegistrationBatchPaymentAction } from '@/app/actions/school-bulk-registration'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const initialStudents = `[
  {
    "firstName": "Ada",
    "middleName": "",
    "lastName": "Okafor",
    "gender": "Female",
    "email": "ada@example.com",
    "class": "JSS1",
    "department": "Science",
    "dateOfBirth": "2012-04-15",
    "dateOfResumption": "2026-09-01",
    "academicSession": "2026/2027",
    "term": "First Term",
    "subjectsDone": ["English Language", "Mathematics"],
    "parentEmail": "parent@example.com",
    "profileImage": ""
  }
]`

const initialTeachers = `[
  {
    "firstName": "Tunde",
    "lastName": "Adebayo",
    "gender": "Male",
    "email": "tunde@example.com",
    "phoneNumber": "08012345678",
    "type": "FULL_TIME",
    "resumptionDate": "2026-09-01",
    "resumptionTime": "08:00",
    "bio": "Experienced Mathematics educator.",
    "department": "Science",
    "qualification": "B.Ed",
    "specialization": "Mathematics",
    "handlingClasses": ["JSS1"],
    "teachingSubjects": ["Mathematics"],
    "presentDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "profileImage": "",
    "applicationLetterUrl": "",
    "cvUrl": ""
  }
]`

const initialParents = `[
  {
    "firstName": "Ngozi",
    "lastName": "Okafor",
    "gender": "Female",
    "email": "parent@example.com",
    "phoneNumber": "08012345678",
    "occupation": "Accountant",
    "address": "",
    "wardAdmissionNumbers": [],
    "profileImage": ""
  }
]`

const initialAdmins = `[
  {
    "firstName": "Ibrahim",
    "lastName": "Bello",
    "email": "ibrahim@example.com",
    "adminLevel": "VICE_PRINCIPAL_ACADEMICS"
  }
]`

type RegistrationResult = {
  batchId: string | null
  checkoutUrl: string | null
  paymentInitializationFailed: boolean
  admissionNumbers: string[]
  staffCodes: string[]
  studentCount: number
  teacherCount: number
  parentCount: number
  adminCount: number
  totalAmount: number
  emailDeliveryFailures: string[]
}

function parseRecords(value: string, label: string) {
  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON array.`)
  return parsed
}

export default function BulkRegistrationPage() {
  const router = useRouter()
  const [students, setStudents] = useState('[]')
  const [teachers, setTeachers] = useState('[]')
  const [parents, setParents] = useState('[]')
  const [admins, setAdmins] = useState('[]')
  const [loading, setLoading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [result, setResult] = useState<RegistrationResult | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await registerSchoolMembersInBulk({
        students: parseRecords(students, 'Students'),
        teachers: parseRecords(teachers, 'Teachers'),
        parents: parseRecords(parents, 'Parents'),
        admins: parseRecords(admins, 'Administrators'),
      })
      setResult(response)
      setStudents('[]')
      setTeachers('[]')
      setParents('[]')
      setAdmins('[]')
      if (response.checkoutUrl) {
        window.location.assign(response.checkoutUrl)
        return
      }
      if (response.paymentInitializationFailed) {
        toast.error('Profiles were created, but checkout could not start. Retry the registration payment below.')
      } else {
        toast.success('School members registered successfully.')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk registration could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  const handleRetryPayment = async () => {
    if (!result?.batchId) return
    setRetrying(true)
    try {
      const response = await retrySchoolRegistrationBatchPaymentAction(result.batchId)
      window.location.assign(response.checkoutUrl)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment could not be started.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <DashboardLayout role="admin">
      <main className="mx-auto max-w-6xl space-y-8 p-4 sm:p-8">
        <header>
          <h1 className="text-3xl font-black text-slate-900">Bulk school registration</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Register students, teachers, parents, and co-administrators together. Submit a JSON array for each group; all required profile and account fields are validated on the server. Use hosted image URLs rather than embedding image data.
            Each student registration is ₦2,000 plus ₦161.25 processing (₦2,161.25 total). Student fees are charged together in one checkout.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Students and pupils</CardTitle>
              <p className="text-sm text-slate-500">Required fields include names, gender, email, class, dates, academic session, term, subjects, and a parent email selected from this batch. Admission numbers and temporary passwords are generated automatically.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="students-json">Student records (JSON)</Label>
              <textarea id="students-json" value={students} onChange={(event) => setStudents(event.target.value)} rows={18} spellCheck={false} className="w-full rounded-xl border bg-background p-3 font-mono text-xs" />
              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold">View a student record example</summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3">{initialStudents}</pre>
              </details>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teachers</CardTitle>
                <p className="text-sm text-slate-500">Add staff profile, employment, department, class, subject, and account details. Staff IDs and temporary passwords are generated automatically.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="teachers-json">Teacher records (JSON)</Label>
                <textarea id="teachers-json" value={teachers} onChange={(event) => setTeachers(event.target.value)} rows={14} spellCheck={false} className="w-full rounded-xl border bg-background p-3 font-mono text-xs" />
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer font-semibold">View a teacher record example</summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3">{initialTeachers}</pre>
                </details>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parents and guardians</CardTitle>
                <p className="text-sm text-slate-500">Each parent must be linked to at least one ward in this school. Use existing admission numbers or link a new student row with parentEmail.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="parents-json">Parent records (JSON)</Label>
                <textarea id="parents-json" value={parents} onChange={(event) => setParents(event.target.value)} rows={10} spellCheck={false} className="w-full rounded-xl border bg-background p-3 font-mono text-xs" />
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer font-semibold">View a parent record example</summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3">{initialParents}</pre>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Other school administrators</CardTitle>
            <p className="text-sm text-slate-500">Available to the Primary Administrator. Choose an approved co-administrator level; temporary passwords are generated and emailed.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label htmlFor="admins-json">Administrator records (JSON)</Label>
            <textarea id="admins-json" value={admins} onChange={(event) => setAdmins(event.target.value)} rows={8} spellCheck={false} className="w-full rounded-xl border bg-background p-3 font-mono text-xs" />
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer font-semibold">View an administrator record example</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3">{initialAdmins}</pre>
            </details>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="space-y-3 p-5 text-sm text-amber-950">
            <p className="font-bold">Temporary passwords are generated automatically.</p>
            <p>Each account receives a unique temporary password by official email and is required to change it at first sign-in. No password is included in this form or saved in the registration batch.</p>
            <p>Maximum batch size: 100 records. Each email must be unique and not already registered. Generated IDs use this school’s registration code prefix.</p>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Registration summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{result.studentCount} students/pupils · {result.teacherCount} teachers · {result.parentCount} parents/guardians · {result.adminCount} co-administrators</p>
              {result.emailDeliveryFailures.length > 0 && (
                <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                  Welcome emails could not be delivered to: {result.emailDeliveryFailures.join(', ')}. Contact support before these users attempt to sign in.
                </p>
              )}
              {result.admissionNumbers.length > 0 && <p className="break-all text-sm"><strong>Admission numbers:</strong> {result.admissionNumbers.join(', ')}</p>}
              {result.staffCodes.length > 0 && <p className="break-all text-sm"><strong>Staff IDs:</strong> {result.staffCodes.join(', ')}</p>}
              {result.totalAmount > 0 && <p><strong>Total registration payment:</strong> ₦{result.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>}
              {result.paymentInitializationFailed && result.batchId && (
                <Button onClick={handleRetryPayment} disabled={retrying}>
                  {retrying ? 'Starting checkout…' : 'Retry student registration payment'}
                </Button>
              )}
              {result.studentCount === 0 && <Button variant="outline" onClick={() => router.push('/dashboard/admin/users/teachers/list')}>Open school directory</Button>}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-amber-600 text-white hover:bg-amber-700">
            {loading ? 'Registering…' : 'Register school members'}
          </Button>
        </div>
      </main>
    </DashboardLayout>
  )
}
