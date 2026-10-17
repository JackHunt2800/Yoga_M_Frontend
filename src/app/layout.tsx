import React from 'react';
import type { Metadata } from 'next';
import { AntdProvider } from '../components/AntdProvider';
import { AuthProvider } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import '../styles/globals.scss';

export const metadata: Metadata = {
  title: 'Methsara Yoga — Yoga Practice Companion',
  description:
    'Authentic curriculum library, teacher curation, and mindful home practice review companion.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <AuthProvider>
          <AntdProvider>
            <Navbar />
            <div style={{ paddingTop: 64, minHeight: '100vh' }}>
              {children}
            </div>
          </AntdProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
