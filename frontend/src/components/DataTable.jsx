import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { Inbox, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ 
  columns, 
  data = [], 
  loading = false, 
  emptyMessage = "No records found", 
  onRowClick,
  pagination
}) {
  if (loading && data.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px] flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={col.key || idx} className="px-6 py-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr 
                  key={row.id || rowIndex} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIndex) => (
                    <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 text-sm text-gray-700">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <EmptyState 
                    icon={Inbox} 
                    title="No Data" 
                    description={emptyMessage} 
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && data.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.perPage) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.perPage, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">{pagination.page}</span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.perPage >= pagination.total}
              className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
