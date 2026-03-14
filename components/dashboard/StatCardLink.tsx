'use client';

import Link from 'next/link';
import React from 'react';

interface StatCardLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function StatCardLink({ href, children }: StatCardLinkProps) {
  return (
    <Link
      href={href}
      className="block transition-all group"
      onMouseEnter={e => {
        const inner = e.currentTarget.querySelector('[data-stat-inner]') as HTMLElement;
        if (inner) {
          inner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)';
          inner.style.borderColor = 'var(--color-primary)';
        }
      }}
      onMouseLeave={e => {
        const inner = e.currentTarget.querySelector('[data-stat-inner]') as HTMLElement;
        if (inner) {
          inner.style.boxShadow = 'var(--shadow-card)';
          inner.style.borderColor = 'var(--color-border)';
        }
      }}
    >
      <div data-stat-card>
        {children}
      </div>
    </Link>
  );
}
