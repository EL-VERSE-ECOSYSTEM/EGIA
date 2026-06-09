'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  GraduationCap,
  ShieldAlert,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-react'

export default function AdminStudentListPage() {
  const students = [
    { id: '1', name: 'Divine Goodnews', admissionNo: 'EGIA/2024/001', class: 'JSS 3A', parent: 'John Goodnews', status: 'ACTIVE' },
    { id: '2', name: 'Mercy Goodnews', admissionNo: 'EGIA/2024/002', class: 'JSS 1C', parent: 'John Goodnews', status: 'ACTIVE' },
    { id: '3', name: 'Chidi Okoro', admissionNo: 'EGIA/2024/045', class: 'SSS 2B', parent: 'Samuel Okoro', status: 'INACTIVE' },
    { id: '4', name: 'Zainab Ahmed', admissionNo: 'EGIA/2024/089', class: 'JSS 2A', parent: 'Ahmed Bello', status: 'ACTIVE' },
    { id: '5', name: 'Tunde Bakare', admissionNo: 'EGIA/2023/112', class: 'SSS 3C', parent: 'Ola Bakare', status: 'SUSPENDED' }
  ]

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACTIVE': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
      case 'INACTIVE': return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Inactive</Badge>
      case 'SUSPENDED': return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>
      default: return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500">View and manage all registered students across all classes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-200">
            <Mail className="w-4 h-4 mr-2" /> Bulk SMS/Email
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 font-bold">
            <Plus className="w-4 h-4 mr-2" /> Add New Student
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by name, admission number, or class..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full justify-between">
            <Filter className="w-4 h-4 mr-2" /> Filter by Class <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full justify-between">
            Status: All <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-700">Student Name</th>
                  <th className="p-4 font-bold text-slate-700">Admission No.</th>
                  <th className="p-4 font-bold text-slate-700">Class</th>
                  <th className="p-4 font-bold text-slate-700">Parent/Guardian</th>
                  <th className="p-4 font-bold text-slate-700">Status</th>
                  <th className="p-4 font-bold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-bold text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-slate-500">{student.admissionNo}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{student.class}</Badge>
                    </td>
                    <td className="p-4 text-slate-600">{student.parent}</td>
                    <td className="p-4">{getStatusBadge(student.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-between items-center text-sm text-slate-500">
        <p>Showing 5 of 1,248 students</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" className="bg-amber-50 border-amber-200 text-amber-700 font-bold">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      </div>
    </div>
  )
}

import { ChevronDown } from 'lucide-react'
