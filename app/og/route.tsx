import { ImageResponse } from 'next/og'
import { getSiteUrl } from '@/utils/supabase/config'

export const runtime = 'nodejs'

export async function GET() {
  const logoUrl = `${getSiteUrl()}/logo.png`

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(217, 119, 6, 0.15) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '40px',
          position: 'relative',
        }}
      >
        {/* Glow Effects */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '200px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            backgroundColor: '#d97706',
            opacity: 0.25,
            filter: 'blur(120px)',
          }}
        />

        {/* Content Box */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {/* Logo Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="EL LEARNERS APP Logo"
            width="120"
            height="120"
            style={{
              borderRadius: '24px',
              border: '2px solid rgba(217, 119, 6, 0.4)',
              boxShadow: '0 20px 50px rgba(217, 119, 6, 0.3)',
              marginBottom: '20px',
              objectFit: 'contain',
            }}
          />

          {/* Title */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-1px',
              marginBottom: '16px',
              color: '#ffffff',
              maxWidth: '1000px',
            }}
          >
            EL LEARNERS APP
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '22px',
              color: '#cbd5e1',
              fontWeight: 600,
              maxWidth: '850px',
              lineHeight: 1.4,
              marginBottom: '32px',
            }}
          >
            Modern School Management System • Real-Time CBT Exams • Automated Report Cards • Parent Sync Portal
          </div>

          {/* Feature Badges */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.15)',
                border: '1px solid rgba(217, 119, 6, 0.4)',
                borderRadius: '16px',
                padding: '10px 20px',
                color: '#f59e0b',
                fontSize: '16px',
                fontWeight: 800,
              }}
            >
              🎓 Modern Educational Management
            </div>
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: '16px',
                padding: '10px 20px',
                color: '#60a5fa',
                fontSize: '16px',
                fontWeight: 800,
              }}
            >
              ⚡ CBT Exams & Live Telemetry
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
