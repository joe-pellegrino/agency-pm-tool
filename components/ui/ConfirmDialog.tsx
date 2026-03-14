'use client';

import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={true} onClose={onCancel} className="relative z-[60]">
      {/* Backdrop with fade transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition duration-300 ease-in-out data-closed:opacity-0"
      />

      {/* Dialog positioning container */}
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
        {/* Panel with scale + fade animation */}
        <DialogPanel
          transition
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden transform transition duration-300 ease-out data-closed:opacity-0 data-closed:scale-95"
        >
          <div className="px-6 py-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${destructive ? 'bg-red-100' : 'bg-amber-100'}`}>
                <AlertTriangle size={18} className={destructive ? 'text-red-600' : 'text-amber-600'} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3B5BDB] hover:bg-[#3B5BDB]'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
