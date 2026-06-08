'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const revenueData = [
  { name: 'Jan', value: 4000000 },
  { name: 'Feb', value: 3000000 },
  { name: 'Mar', value: 5000000 },
  { name: 'Apr', value: 2780000 },
  { name: 'May', value: 1890000 },
  { name: 'Jun', value: 2390000 },
]

export function AdminRevenueChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={revenueData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`} />
        <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
        <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
