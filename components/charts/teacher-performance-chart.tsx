'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

const performanceData = [
  { name: 'Wk 1', value: 65 },
  { name: 'Wk 2', value: 72 },
  { name: 'Wk 3', value: 68 },
  { name: 'Wk 4', value: 85 },
  { name: 'Wk 5', value: 78 },
  { name: 'Wk 6', value: 92 },
]

export function TeacherPerformanceChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={performanceData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
            padding: '12px'
          }}
          itemStyle={{ color: '#8B5CF6', fontWeight: 900 }}
          labelStyle={{ color: '#0F172A', fontWeight: 900, marginBottom: '4px' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#8B5CF6"
          strokeWidth={4}
          fillOpacity={1}
          fill="url(#colorValue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
