import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export async function GET() {
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
          backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.15) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(147, 51, 234, 0.15) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '60px',
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
            backgroundColor: '#2563eb',
            opacity: 0.25,
            filter: 'blur(120px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            right: '200px',
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
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              borderRadius: '9999px',
              padding: '10px 24px',
              color: '#fb923c',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '2px',
              marginBottom: '28px',
              textTransform: 'uppercase',
            }}
          >
            <span>🎓 NEXT-GEN SCHOOL MANAGEMENT & CBT PORTAL</span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-1px',
              marginBottom: '20px',
              background: 'linear-gradient(to right, #ffffff, #93c5fd, #f97316)',
              backgroundClip: 'text',
              color: 'transparent',
              maxWidth: '1000px',
            }}
          >
            EL LEARNERS APP
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              fontWeight: 600,
              maxWidth: '850px',
              lineHeight: 1.4,
              marginBottom: '36px',
            }}
          >
            Empowering Schools with Real-time CBT Exams, Automated Report Cards, Parent Portal Sync & Smart School Administration
          </div>

          {/* Feature Badges Grid */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '12px 20px',
                color: '#38bdf8',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              ⚡ Automated CBT Exams & Grading
            </div>
            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '12px 20px',
                color: '#4ade80',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              📊 Instant Parent Report Cards
            </div>
            <div
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                padding: '12px 20px',
                color: '#c084fc',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              🏫 Primary & Secondary School Portal
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
