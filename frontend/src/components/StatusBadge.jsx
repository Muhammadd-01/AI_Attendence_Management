import React from 'react';
import { CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react';
import { getStatusColor } from '../utils/formatters';

export default function StatusBadge({ status }) {
  const colorClass = getStatusColor(status);
  
  const getIcon = () => {
    switch (status?.toLowerCase()) {
      case 'present': return <CheckCircle className="w-4 h-4 mr-1.5" />;
      case 'absent': return <XCircle className="w-4 h-4 mr-1.5" />;
      case 'late': return <Clock className="w-4 h-4 mr-1.5" />;
      default: return <HelpCircle className="w-4 h-4 mr-1.5" />;
    }
  };

  const label = status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown';

  return (
    <span className={`badge ${colorClass}`}>
      {getIcon()}
      {label}
    </span>
  );
}
