'use client'

import { useEffect, useState } from 'react'
import { getAllParents } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'

export default function ParentsPage() {
  const [parents, setParents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadParents() {
      try {
        const data = await getAllParents()
        setParents(data)
      } catch (error) {
        console.error('Failed to load parents:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadParents()
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parent Management</h1>
          <p className="text-gray-600 mt-1">Total Parents: {parents.length}</p>
        </div>
        <Link href="/dashboard/admin/users/parents/add">
          <Button className="gap-2 bg-green-600 hover:bg-green-700">
            <PlusCircle className="w-4 h-4" />
            Add Parent
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading parents...</p>
          </CardContent>
        </Card>
      ) : parents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">No parents found</p>
            <Link href="/dashboard/admin/users/parents/add">
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <PlusCircle className="w-4 h-4" />
                Add First Parent
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Parents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-gray-600">
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Phone</th>
                    <th className="text-left py-2 px-4">Relationship</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map((parent) => (
                    <tr key={parent.id} className="border-b hover:bg-green-50">
                      <td className="py-3 px-4 font-medium">{parent.firstName} {parent.lastName}</td>
                      <td className="py-3 px-4">{parent.user?.email || '-'}</td>
                      <td className="py-3 px-4">{parent.phoneNumber || '-'}</td>
                      <td className="py-3 px-4">{parent.relationship || '-'}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button className="p-1 hover:bg-green-200 rounded transition-colors">
                          <Edit className="w-4 h-4 text-green-600" />
                        </button>
                        <button className="p-1 hover:bg-red-200 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
