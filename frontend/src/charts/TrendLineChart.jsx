import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendLineChart({ data, height = 300 }) {
  return (
    <div style={{ height: height, width: '100%' }}>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [`${value}%`, 'Attendance Rate']}
          />
          <Line 
            type="monotone" 
            dataKey="rate" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
