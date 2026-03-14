import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ClientProviders } from './ClientProviders';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from 'sonner';
import MainLayout from './MainLayout';

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
              <MainLayout>
                {children}
              </MainLayout>
            </SidebarProvider>
          </ClientProviders>
        </ThemeProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
