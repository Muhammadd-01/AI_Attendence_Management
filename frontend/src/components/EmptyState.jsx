import React from 'react';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
