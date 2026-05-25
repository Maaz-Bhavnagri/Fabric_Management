'use client';

import { Inter } from 'next/font/google'
import './globals.css'
import { ClientProviders } from '@/components/ClientProviders'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientProviders>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ClientProviders>
      </body>
    </html>
  )
}
