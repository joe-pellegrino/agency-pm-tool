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
    <div>
      <Dialog open={isOpen} onClose={onClose} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
        />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                {/* Panel body */}
                <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-gray-900 shadow-xl">

                  {/* Header */}
                  {isCreate ? (
                    <div className="flex-shrink-0 bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold text-white">
                          {title}
                        </DialogTitle>
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-md bg-indigo-700 text-indigo-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                    <div className="flex-shrink-0 flex items-center justify-between px-4 py-6 sm:px-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <DialogTitle className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {title}
                      </DialogTitle>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        <span className="sr-only">Close panel</span>
                        <X aria-hidden="true" size={20} strokeWidth={1.5} />
                      </button>
                    </div>
                  )}

                  {/* Scrollable content */}
                  <div className="relative mt-0 flex-1 px-4 sm:px-6 py-5">
                    {children}
                  </div>

                  {/* Optional sticky footer */}
                  {footer && (
                    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                      {footer}
                    </div>
                  )}
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
