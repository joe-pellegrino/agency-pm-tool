import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ClientProviders } from './ClientProviders';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RJ Media — Agency PM',
  description: 'Project management dashboard for RJ Media',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ backgroundColor: '#F0F3F8', color: '#1E2A3A' }}>
        <ClientProviders>
          <SidebarProvider>
            <Sidebar />
            <main className="lg:ml-64 min-h-screen">
              {children}
            </main>
          </SidebarProvider>
        </ClientProviders>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
