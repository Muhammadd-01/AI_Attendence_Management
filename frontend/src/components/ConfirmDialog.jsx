import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, isLoading = false }) {
  const handleConfirm = async () => {
    await onConfirm();
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={!isLoading ? onClose : undefined} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100 text-danger' : 'bg-yellow-100 text-warning'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-3 w-full">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 ${danger ? 'bg-danger hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'} disabled:opacity-70`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
