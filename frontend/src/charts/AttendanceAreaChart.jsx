import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AttendanceAreaChart({ data, height = 300 }) {
  return (
    <div style={{ height: height, width: '100%' }}>
      <ResponsiveContainer>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [`${value}%`, 'Attendance Rate']}
          />
          <Area 
            type="monotone" 
            dataKey="rate" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRate)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
