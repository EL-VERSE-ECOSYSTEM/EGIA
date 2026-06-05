'use client'

import { useEffect, useState } from 'react'
import { getAllStudents } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Edit, Trash2 } from 'lucide-react'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStudents() {
      try {
        const data = await getAllStudents()
        setStudents(data)
      } catch (error) {
        console.error('Failed to load students:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadStudents()
  }, [])

  const classes = ['JSS1A', 'JSS1B', 'JSS1C', 'JSS2A', 'JSS2B', 'JSS2C', 'JSS3A', 'JSS3B', 'JSS3C', 'SSS1A', 'SSS1B', 'SSS1C', 'SSS2A', 'SSS2B', 'SSS2C', 'SSS3A', 'SSS3B', 'SSS3C']
  
  const groupedByClass = classes.reduce((acc, cls) => {
    acc[cls] = students.filter((s) => s.class === cls)
    return acc
  }, {} as Record<string, typeof students>)

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Total Students: {students.length}</p>
        </div>
        <Link href="/dashboard/admin/users/students/add">
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
            <PlusCircle className="w-4 h-4" />
            Add Student
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading students...</p>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500 mb-4">No students found</p>
            <Link href="/dashboard/admin/users/students/add">
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                <PlusCircle className="w-4 h-4" />
                Add First Student
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(groupedByClass).map(([className, classStudents]) =>
            classStudents.length > 0 ? (
              <Card key={className}>
                <CardHeader>
                  <CardTitle className="text-orange-700">{className}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b">
                        <tr className="text-gray-600">
                          <th className="text-left py-2 px-4">Name</th>
                          <th className="text-left py-2 px-4">Email</th>
                          <th className="text-left py-2 px-4">Admission No.</th>
                          <th className="text-left py-2 px-4">Gender</th>
                          <th className="text-right py-2 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map((student) => (
                          <tr key={student.id} className="border-b hover:bg-orange-50">
                            <td className="py-3 px-4 font-medium">{student.firstName} {student.lastName}</td>
                            <td className="py-3 px-4">{student.user?.email || '-'}</td>
                            <td className="py-3 px-4">{student.studentId}</td>
                            <td className="py-3 px-4">{student.gender || '-'}</td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button className="p-1 hover:bg-orange-200 rounded transition-colors">
                                <Edit className="w-4 h-4 text-orange-600" />
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
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
