import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AttendancePieChart({ present = 0, absent = 0, late = 0, height = 300 }) {
  const data = [
    { name: 'Present', value: present, color: '#10b981' },
    { name: 'Late', value: late, color: '#f59e0b' },
    { name: 'Absent', value: absent, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const total = present + absent + late;

  return (
    <div className="relative" style={{ height: height, width: '100%' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [value, 'Students']}
          />
          <Legend iconType="circle" verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-8">
        <span className="text-3xl font-bold text-gray-800">{total}</span>
        <span className="text-xs text-gray-500">Total</span>
      </div>
    </div>
  );
}
