export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (minutes) => {
  if (minutes === undefined || minutes === null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

export const formatPercentage = (value) => {
  if (value === undefined || value === null) return '0%';
  return `${Number(value).toFixed(1)}%`;
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'present': return 'badge-present';
    case 'absent': return 'badge-absent';
    case 'late': return 'badge-late';
    default: return 'badge-unknown';
  }
};

export const getConfidenceColor = (confidence) => {
  if (confidence > 0.8) return 'text-success';
  if (confidence > 0.6) return 'text-warning';
  return 'text-danger';
};

export const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  
  return 'just now';
};
