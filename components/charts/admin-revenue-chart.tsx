'use client'

import React, { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { db } from '@/lib/db' // This won't work on client side directly
// I'll need a server action to fetch this data.

const data = [
  { name: 'Week 1', revenue: 400000 },
  { name: 'Week 2', revenue: 300000 },
  { name: 'Week 3', revenue: 200000 },
  { name: 'Week 4', revenue: 278000 },
  { name: 'Week 5', revenue: 189000 },
  { name: 'Week 6', revenue: 239000 },
  { name: 'Week 7', revenue: 349000 },
]

export function AdminRevenueChart() {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
            tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip
            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#059669"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
