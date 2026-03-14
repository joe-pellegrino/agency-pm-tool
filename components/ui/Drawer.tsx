'use client';

import { ReactNode } from 'react';
import { Dialog, DialogPanel, DialogBackdrop } from '@headlessui/react';
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
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop — fades in/out */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity duration-500 ease-in-out data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 pl-10 sm:pl-16">
          {/* Slide-over panel */}
          <DialogPanel
            transition
            className="group/panel relative ml-auto block size-full max-w-md transform transition duration-500 ease-in-out data-[closed]:translate-x-full sm:duration-700 sm:max-w-lg"
          >
            {/* Floating close button — sits outside the panel, fades with it */}
            <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out group-data-[closed]/panel:opacity-0 sm:-ml-10 sm:pr-4">
              <button
                type="button"
                onClick={onClose}
                className="relative rounded-md text-gray-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <span className="sr-only">Close panel</span>
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex h-full flex-col bg-white dark:bg-gray-900 shadow-xl overflow-hidden">

              {/* Header */}
              {isCreate ? (
                <div className="flex-shrink-0 bg-indigo-700 px-4 py-6 sm:px-6">
                  <h2 className="text-base font-semibold text-white">{title}</h2>
                  {subtitle && (
                    <p className="mt-1 text-sm text-indigo-300">{subtitle}</p>
                  )}
                </div>
              ) : (
                <div className="flex-shrink-0 px-4 py-6 sm:px-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
                </div>
              )}

              {/* Scrollable content */}
              <div className="relative flex-1 overflow-y-auto px-4 py-5 sm:px-6">
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
    </Dialog>
  );
}
