'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
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
      <BarChart data={revenueData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
          tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
        />
        <Tooltip
          cursor={{ fill: '#F1F5F9' }}
          contentStyle={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            padding: '12px'
          }}
          itemStyle={{ color: '#F59E0B', fontWeight: 900 }}
          labelStyle={{ color: '#0F172A', fontWeight: 900, marginBottom: '4px' }}
          formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
        />
        <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={40}>
          {revenueData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={index === 2 ? '#F59E0B' : '#E2E8F0'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
