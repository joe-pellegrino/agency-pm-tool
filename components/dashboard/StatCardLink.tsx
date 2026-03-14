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
        const elem = e.currentTarget as HTMLElement;
        const card = elem.querySelector('[data-stat-card]') as HTMLElement;
        if (card) {
          card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)';
          card.style.borderColor = '#D0D6E0';
        }
      }}
      onMouseLeave={e => {
        const elem = e.currentTarget as HTMLElement;
        const card = elem.querySelector('[data-stat-card]') as HTMLElement;
        if (card) {
          card.style.boxShadow = 'var(--shadow-card)';
          card.style.borderColor = 'var(--color-border)';
        }
      }}
    >
      <div data-stat-card>
        {children}
      </div>
    </Link>
  );
}
