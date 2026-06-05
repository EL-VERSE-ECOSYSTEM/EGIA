'use client'

import { useEffect, useState } from 'react'
import { getAssessments } from '@/app/actions/assessments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Edit, Eye } from 'lucide-react'

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAssessments() {
      try {
        const data = await getAssessments()
        setAssessments(data)
      } catch (error) {
        console.error('Failed to load assessments:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAssessments()
  }, [])

  const draftAssessments = assessments.filter(a => a.status === 'draft')
  const publishedAssessments = assessments.filter(a => a.status === 'published')

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-1">Create and manage your assessments</p>
        </div>
        <Link href="/dashboard/teacher/assessments/create">
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
            <PlusCircle className="w-4 h-4" />
            Create Assessment
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Loading assessments...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {draftAssessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-700">Draft Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-gray-600">
                        <th className="text-left py-2 px-4">Title</th>
                        <th className="text-left py-2 px-4">Subject</th>
                        <th className="text-left py-2 px-4">Class</th>
                        <th className="text-left py-2 px-4">Questions</th>
                        <th className="text-right py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftAssessments.map((assess) => (
                        <tr key={assess.id} className="border-b hover:bg-purple-50">
                          <td className="py-3 px-4 font-medium">{assess.title}</td>
                          <td className="py-3 px-4">{assess.subject}</td>
                          <td className="py-3 px-4">{assess.class}</td>
                          <td className="py-3 px-4">{assess.questions?.length || 0}</td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button className="p-1 hover:bg-purple-200 rounded transition-colors">
                              <Edit className="w-4 h-4 text-purple-600" />
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

          {publishedAssessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Published Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-gray-600">
                        <th className="text-left py-2 px-4">Title</th>
                        <th className="text-left py-2 px-4">Subject</th>
                        <th className="text-left py-2 px-4">Class</th>
                        <th className="text-left py-2 px-4">Questions</th>
                        <th className="text-right py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {publishedAssessments.map((assess) => (
                        <tr key={assess.id} className="border-b hover:bg-green-50">
                          <td className="py-3 px-4 font-medium">{assess.title}</td>
                          <td className="py-3 px-4">{assess.subject}</td>
                          <td className="py-3 px-4">{assess.class}</td>
                          <td className="py-3 px-4">{assess.questions?.length || 0}</td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button className="p-1 hover:bg-green-200 rounded transition-colors">
                              <Eye className="w-4 h-4 text-green-600" />
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

          {assessments.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500 mb-4">No assessments yet</p>
                <Link href="/dashboard/teacher/assessments/create">
                  <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <PlusCircle className="w-4 h-4" />
                    Create First Assessment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
