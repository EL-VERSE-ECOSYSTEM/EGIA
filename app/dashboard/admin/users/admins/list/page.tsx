'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldCheck, UserPlus, RefreshCw, Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { getSchoolAdmins } from '@/app/actions/admin'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AdminsListPage() {
  const [adminsList, setAdminsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadAdmins = async () => {
    try {
      setLoading(true)
      const data = await getSchoolAdmins()
      setAdminsList(data || [])
    } catch (err) {
      console.error('Failed to load school admins:', err)
      toast.error('Failed to load administrator accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  // Real-time synchronization with Supabase Database user table
  useRealtimeSubscription('user', () => {
    loadAdmins()
  })

  return (
    <DashboardLayout role="admin">
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-blue-100 text-[#1E3A8A] border border-blue-200 text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full">
              Institutional Governance
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-3">School Administrators</h1>
            <p className="text-slate-500 font-bold text-sm mt-1">
              Active co-administrators managing academy operations and system controls.
            </p>
          </div>
          <Link href="/dashboard/admin/users/admins/add">
            <Button className="h-12 bg-[#1E3A8A] hover:bg-blue-800 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 px-6 shadow-lg shadow-blue-900/20">
              <UserPlus className="w-4 h-4" /> Add Co-Admin
            </Button>
          </Link>
        </div>

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1E3A8A]" /> Admin Accounts Ledger
              </CardTitle>
              <CardDescription className="text-slate-400 font-bold text-xs">
                Synchronized in real-time with Supabase Database
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={loadAdmins} className="text-slate-400 hover:text-blue-800">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1E3A8A] mx-auto mb-3" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading admin records...</p>
              </div>
            ) : adminsList.length === 0 ? (
              <div className="p-20 text-center text-slate-400 font-bold text-sm italic">
                No co-administrators registered yet. Click "Add Co-Admin" to grant administrative access.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400">Administrator</TableHead>
                    <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400">Email Address</TableHead>
                    <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400">Role</TableHead>
                    <TableHead className="p-4 font-black text-[10px] uppercase text-slate-400 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 font-medium text-xs">
                  {adminsList.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="p-4 font-black text-slate-900">
                        {admin.name || 'School Administrator'}
                      </TableCell>
                      <TableCell className="p-4 text-slate-600 font-mono flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {admin.email}
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge className="bg-blue-50 text-[#1E3A8A] border border-blue-200 font-black text-[10px]">
                          {admin.userRole?.role || 'ADMIN'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-right">
                        <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[10px] gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
