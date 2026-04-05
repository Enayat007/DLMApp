import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/context/AuthContext';

export const metadata: Metadata = {
  title:       { default: 'MedLicense', template: '%s | MedLicense' },
  description: 'Doctor License Management SaaS — multi-tenant, auto-expiry tracking, role-based access.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{ duration: 3500, style: { borderRadius: '10px', fontSize: '14px' } }}
        />
      </body>
    </html>
  );
}
