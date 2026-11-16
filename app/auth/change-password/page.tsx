'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { changeTemporaryPasswordAction } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, LockKeyhole } from 'lucide-react'

export default function ChangeTemporaryPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('The passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const result = await changeTemporaryPasswordAction(password)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.replace('/dashboard-redirect')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Password update failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <Card className="w-full max-w-lg border-slate-700 bg-slate-900 text-white">
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
            <LockKeyhole className="size-6" />
          </div>
          <CardTitle className="text-2xl">Set a new password</CardTitle>
          <p className="text-sm leading-6 text-slate-300">
            For your security, change the temporary password before using your account. Choose at least 12 characters.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </div>
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" />Updating password…</> : 'Save new password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
