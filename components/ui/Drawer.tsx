'use client';

import { ReactNode } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'create' | 'details';
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'details',
}: DrawerProps) {
  const isCreate = variant === 'create';

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-[200]">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity duration-300 ease-in-out data-closed:opacity-0"
        style={{ top: '56px' }}
      />

      <div className="fixed inset-0 flex justify-end" style={{ top: '56px' }}>
        <DialogPanel
          transition
          className="relative flex flex-col w-full max-w-md transition duration-300 ease-in-out data-closed:translate-x-full"
          style={{ height: '100%', backgroundColor: 'white' }}
        >
          {/* Header */}
          {isCreate ? (
            <div className="flex-shrink-0 px-4 py-6 sm:px-6" style={{ backgroundColor: '#4338CA' }}>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-semibold text-white">
                  {title}
                </DialogTitle>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md text-indigo-200 hover:text-white"
                >
                  <span className="sr-only">Close panel</span>
                  <X aria-hidden="true" size={24} strokeWidth={1.5} />
                </button>
              </div>
              {subtitle && (
                <p className="mt-1 text-sm text-indigo-300">{subtitle}</p>
              )}
            </div>
          ) : (
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-5 sm:px-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <DialogTitle className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close panel</span>
                <X aria-hidden="true" size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            {children}
          </div>

          {/* Optional sticky footer */}
          {footer && (
            <div className="flex-shrink-0 border-t border-gray-200">
              {footer}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
