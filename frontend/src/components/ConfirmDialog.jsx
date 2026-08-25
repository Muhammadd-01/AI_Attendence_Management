import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${danger ? 'bg-red-100 text-danger' : 'bg-yellow-100 text-warning'}`}>
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex space-x-3 w-full">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={`flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors ${danger ? 'bg-danger hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
