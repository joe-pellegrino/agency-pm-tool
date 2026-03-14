'use client';

import { ReactNode, useRef, useEffect } from 'react';
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
  variant = 'details'
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save the currently focused element so we can restore it when drawer closes
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Prevent body scroll when drawer is open
    document.body.style.overflow = 'hidden';

    // Auto-focus the close button
    setTimeout(() => {
      const closeButton = drawerRef.current?.querySelector('button[data-drawer-close]') as HTMLButtonElement;
      closeButton?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = 'auto';
      // Restore focus to the element that was focused before the drawer opened
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  const isCreateVariant = variant === 'create';

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative" style={{ zIndex: 1000 }}>
      {/* Backdrop with smooth fade transition */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/30 transition-opacity ease-in-out duration-500 sm:duration-700 data-[closed]:opacity-0"
        style={{ zIndex: 999 }}
      />

      {/* Drawer positioning container */}
      <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 1001 }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            {/* Panel with slide-in animation */}
            <DialogPanel
              ref={drawerRef}
              transition
              className="pointer-events-auto relative ml-auto flex flex-col size-full max-w-md sm:max-w-lg bg-white dark:bg-gray-900 shadow-2xl shadow-black/20 transform transition ease-in-out duration-500 sm:duration-700 data-[closed]:translate-x-full"
            >
              {/* Header - variant-dependent */}
              {isCreateVariant ? (
                <div className="py-6 px-6 bg-indigo-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-white">
                      {title}
                    </h2>
                    <button
                      onClick={onClose}
                      data-drawer-close
                      className="bg-indigo-700 rounded-md text-indigo-200 hover:text-white transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-white"
                      aria-label="Close drawer"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  {subtitle && (
                    <div className="mt-1">
                      <p className="text-sm text-indigo-300">
                        {subtitle}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    data-drawer-close
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                    aria-label="Close drawer"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {children}
              </div>

              {/* Footer - only shown if provided */}
              {footer && (
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                  {footer}
                </div>
              )}
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
