import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ClientProviders } from './ClientProviders';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'RJ Media — Agency PM',
  description: 'Project management dashboard for RJ Media',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <ThemeProvider>
          <ClientProviders>
            <SidebarProvider>
              <Sidebar />
              <main className="lg:ml-60" style={{ marginTop: '56px', minHeight: 'calc(100vh - 56px)', backgroundColor: 'var(--color-bg-page)' }}>
                {children}
              </main>
            </SidebarProvider>
          </ClientProviders>
        </ThemeProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
