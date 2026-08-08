import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import './globals.css'
import { RealtimeProvider } from '@/components/realtime/RealtimeProvider'

export const metadata: Metadata = {
  title: "EL GOODNEWS INT'L ACADEMY - Empowering Excellence",
  description: 'Complete school management system with CBT, assessments, and child monitoring.',
  generator: 'ELCODERS',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "EL GOODNEWS",
  }
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
          <div className="flex-1">
            {children}
          </div>
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
