'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { linkChild } from '@/app/actions/parent'

export default function LinkChildPage() {
  const [admNo, setAdmNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleLink = async () => {
    setLoading(true)
    try {
      await linkChild(admNo, 'current-parent-id')
      setSuccess(true)
    } catch (e) {
      alert('Student not found.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Link Your Child</h1>
      <Card>
        <CardHeader><CardTitle>Admission Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Student Admission Number</Label>
            <Input placeholder="GOD12345" value={admNo} onChange={e => setAdmNo(e.target.value)} />
          </div>
          {success && <p className="text-green-600 font-medium">Child linked successfully! Refresh your child list.</p>}
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleLink}
            disabled={loading || success}
          >
            {loading ? 'Linking...' : 'Link Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
