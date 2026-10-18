import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import './globals.css'
import { RealtimeProvider } from '@/components/realtime/RealtimeProvider'
import { TimeThemeProvider } from '@/components/TimeThemeProvider'
import { FloatingSupportWidget } from '@/components/support/FloatingSupportWidget'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_SITE_URL || 'https://el-goodnews-academy.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EL LEARNERS APP - Smart School Management System & CBT Portal 2026",
    template: "%s | EL LEARNERS APP",
  },
  description: "All-in-one Smart School Management System & CBT Exam Portal. Features instant automated grading, real-time parent monitoring, primary and secondary school report cards, online fee payment, and multi-tenant administration.",
  keywords: [
    "EL LEARNERS APP",
    "School Management System",
    "Best School Management Portal Nigeria",
    "Smart School Management Portal",
    "CBT Portal Nigeria",
    "WAEC JAMB CBT Practice Portal 2026",
    "Realtime Student Portal",
    "Primary School Portal Nigeria",
    "Secondary School Portal Nigeria",
    "Korapay School Fees Payment",
    "Automated Report Card Generator",
    "Parent Portal Nigeria",
    "Online Result Checker",
    "FCM Realtime Push Notifications",
    "Primary Secondary School Management Software Nigeria",
    "Multi-tenant School Portal",
    "School Administration Software",
    "Digital Learning Platform",
    "New School Portal 2026",
    "Computer Based Test Software"
  ],
  authors: [{ name: "ELCODERS", url: siteUrl }],
  creator: "ELCODERS",
  publisher: "ELCODERS",
  generator: "ELCODERS",
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' }
    ],
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    title: 'EL LEARNERS APP - Empowering Academic Excellence & Smart Schooling',
    description: 'Transform education with EL LEARNERS APP. Powerful real-time CBT exams, instant parent performance sync, digital library, and smart school administration.',
    siteName: 'EL LEARNERS APP',
    images: [
      {
        url: `${siteUrl}/og`,
        width: 1200,
        height: 630,
        alt: 'EL LEARNERS APP - Next-Gen Smart School Management & CBT Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EL LEARNERS APP - Next-Gen Smart School Management & CBT Portal',
    description: 'Revolutionizing school administration, CBT examinations, parent updates, and real-time student tracking.',
    images: [`${siteUrl}/og`],
    creator: '@elcoders',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "EL LEARNERS APP",
  },
  verification: {
    google: "KVhChvalPrqDzEZblsbANYolEv7pN-G7oJVqbGwONBg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased flex flex-col min-h-screen">
        <RealtimeProvider>
          <TimeThemeProvider />
          <div className="flex-1">
            {children}
          </div>
          <FloatingSupportWidget />
          <CookieConsentBanner />
        </RealtimeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
        {/* Simple inline PWA registration block */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('ServiceWorker registered with scope: ', reg.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `
          }}
        />
      </body>
    </html>
  )
}
