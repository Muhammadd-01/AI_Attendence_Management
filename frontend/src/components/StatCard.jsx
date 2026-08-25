import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success/10 text-success',
    danger: 'bg-danger/10 text-danger',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color] || colorMap.primary}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`flex items-center font-medium ${trendUp ? 'text-success' : 'text-danger'}`}>
            {trendUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {trend}
          </span>
          <span className="text-gray-400 ml-2">vs last month</span>
        </div>
      )}
    </div>
  );
}
