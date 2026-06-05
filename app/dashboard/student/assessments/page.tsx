'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'

export default function StudentAssessmentsPage() {
  const [assessments] = useState([
    {
      id: '1',
      title: 'Mathematics Quiz Week 1',
      subject: 'Mathematics',
      totalMarks: 50,
      duration: 30,
      status: 'active',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      id: '2',
      title: 'English Comprehension Test',
      subject: 'English',
      totalMarks: 100,
      duration: 60,
      status: 'active',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
  ])

  const activeAssessments = assessments.filter(a => a.status === 'active')
  const completedAssessments = assessments.filter(a => a.status === 'completed')

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
        <p className="text-gray-600 mt-1">Available quizzes and exams</p>
      </div>

      {activeAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-700">Active Assessments</CardTitle>
            <CardDescription>Quizzes you can take now</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeAssessments.map((assessment) => (
              <div key={assessment.id} className="p-4 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                    <p className="text-sm text-gray-600">{assessment.subject}</p>
                  </div>
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Marks:</span>
                    <p className="font-semibold">{assessment.totalMarks}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-semibold">{assessment.duration} mins</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Deadline:</span>
                    <p className="font-semibold">{formatDate(assessment.deadline)}</p>
                  </div>
                </div>

                <Link href={`/dashboard/student/assessments/${assessment.id}/take`}>
                  <Button className="w-full gap-2 bg-orange-600 hover:bg-orange-700">
                    <Clock className="w-4 h-4" />
                    Take Assessment
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {completedAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Completed Assessments</CardTitle>
            <CardDescription>Quizzes you have taken</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedAssessments.map((assessment) => (
              <div key={assessment.id} className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
                  <p className="text-sm text-gray-600">{assessment.subject}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {assessments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No assessments available at the moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
