import { Geist, Geist_Mono } from 'next/font/google'

import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { env } from '@/lib/env'

import './globals.css'

import type { Metadata } from 'next'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

const APP_NAME = 'Knack'
const APP_DESCRIPTION =
  'An open-source utility belt for the web — converters, encoders, generators, paste, short links, and more.'

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: env.NEXT_PUBLIC_APP_URL,
    siteName: APP_NAME,
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary',
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: ['/icon-512.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
