import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Footer } from '@/components/footer'
import { SessionProvider } from "next-auth/react"
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'EL GOODNEWS Academy - School Management System',
  description: 'Complete school management system with assessments, grading, attendance tracking, and payment management',
  generator: 'ELCODERS',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <SessionProvider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </SessionProvider>
      </body>
    </html>
  )
}
