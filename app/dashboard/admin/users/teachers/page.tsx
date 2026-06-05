'use client'

import { useEffect, useState } from 'react'
import { getAllTeachers } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTeachers() {
      try {
        const data = await getAllTeachers()
        setTeachers(data)
      } catch (error) {
        console.error('Failed to load teachers:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTeachers()
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600 mt-1">Total Teachers: {teachers.length}</p>
        </div>
        <Link href="/dashboard/admin/users/teachers/add">
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
            <PlusCircle className="w-4 h-4" />
            Add Teacher
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading teachers...</p>
          </CardContent>
        </Card>
      ) : teachers.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">No teachers found</p>
            <Link href="/dashboard/admin/users/teachers/add">
              <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                <PlusCircle className="w-4 h-4" />
                Add First Teacher
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-gray-600">
                    <th className="text-left py-2 px-4">Name</th>
                    <th className="text-left py-2 px-4">Email</th>
                    <th className="text-left py-2 px-4">Qualification</th>
                    <th className="text-left py-2 px-4">Specialization</th>
                    <th className="text-right py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b hover:bg-purple-50">
                      <td className="py-3 px-4 font-medium">{teacher.firstName} {teacher.lastName}</td>
                      <td className="py-3 px-4">{teacher.user?.email || '-'}</td>
                      <td className="py-3 px-4">{teacher.qualification || '-'}</td>
                      <td className="py-3 px-4">{teacher.specialization || '-'}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button className="p-1 hover:bg-purple-200 rounded transition-colors">
                          <Edit className="w-4 h-4 text-purple-600" />
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
