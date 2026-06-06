'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createStudent } from '@/app/actions/admin'

export default function BulkImportPage() {
  const router = useRouter()
  const [data, setData] = useState('')
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    setLoading(true)
    try {
      const students = JSON.parse(data)
      for (const s of students) {
        await createStudent({
          ...s,
          password: s.password || 'Temporary123!',
        })
      }
      router.push('/dashboard/admin/users/students/list')
    } catch (error) {
      alert('Failed to import students. Ensure valid JSON format.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Bulk Student Import</h1>
      <Card>
        <CardHeader>
          <CardTitle>Paste JSON Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="w-full h-64 p-4 font-mono text-sm border rounded-lg"
            placeholder='[{"firstName": "John", "lastName": "Doe", "email": "john@example.com", "admissionNumber": "GOD001", "class": "JSS1"}]'
            value={data}
            onChange={e => setData(e.target.value)}
          />
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700"
            onClick={handleImport}
            disabled={loading}
          >
            {loading ? 'Importing...' : 'Start Bulk Import'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
