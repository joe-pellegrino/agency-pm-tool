import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ClientProviders } from './ClientProviders';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'RJ Media — Agency PM',
  description: 'Project management dashboard for RJ Media',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#EDF0F5', color: '#1E2A3A', margin: 0 }}>
        <ClientProviders>
          <SidebarProvider>
            <Sidebar />
            <main className="lg:ml-60" style={{ marginTop: '56px', minHeight: 'calc(100vh - 56px)', backgroundColor: '#EDF0F5' }}>
              {children}
            </main>
          </SidebarProvider>
        </ClientProviders>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
