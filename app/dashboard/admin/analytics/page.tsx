'use client'

import { useEffect, useState } from 'react'
import { getSchoolAnalytics, generatePerformanceReport, generateFinancialReport } from '@/app/actions/analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  const [schoolStats, setSchoolStats] = useState<any>(null)
  const [performanceReport, setPerformanceReport] = useState<any>(null)
  const [financialReport, setFinancialReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [school, performance, financial] = await Promise.all([
          getSchoolAnalytics(),
          generatePerformanceReport(),
          generateFinancialReport(),
        ])
        setSchoolStats(school)
        setPerformanceReport(performance)
        setFinancialReport(financial)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  const performanceData = performanceReport?.performanceByClass ? Object.entries(performanceReport.performanceByClass).map(([cls, data]: [string, any]) => ({
    class: cls,
    average: data.average,
    pass: data.pass,
    fail: data.fail,
  })) : []

  const financialData = financialReport?.byFeeType ? Object.entries(financialReport.byFeeType).map(([type, amount]: [string, any]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: amount,
  })) : []

  const COLORS = ['#F97316', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">School performance and financial insights</p>
        </div>
        <Button className="gap-2 bg-amber-600 hover:bg-amber-700">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {schoolStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{schoolStats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">₦{schoolStats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Payment Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{schoolStats.paymentCompletionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
            <CardDescription>Average scores by class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#8B5CF6" name="Average" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution</CardTitle>
            <CardDescription>Income by fee type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={financialData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value">
                  {financialData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {financialReport && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Collected</p>
              <p className="text-2xl font-bold text-green-600">₦{financialReport.totalCollected.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-red-600">₦{financialReport.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Rate</p>
              <p className="text-2xl font-bold text-blue-600">{financialReport.completionRate}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
