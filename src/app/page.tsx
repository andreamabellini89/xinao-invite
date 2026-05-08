'use client'
import { useRouter } from 'next/navigation'
import { THEME as T } from '@/lib/utils'

export default function Home() {
  const router = useRouter()

  const roles = [
    { label: 'ADMIN DASHBOARD', sub: 'Manage events, guests & check-ins', path: '/admin', icon: '⊞' },
    { label: 'GUEST PORTAL', sub: 'Register & receive your invitation', path: '/invite/demo', icon: '✉' },
    { label: 'EVENT SCANNER', sub: 'Scan QR codes at the entrance', path: '/scanner', icon: '⊟' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.black, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: T.gold, fontFamily: "'Georgia',serif", letterSpacing: '0.1em', marginBottom: 4 }}>
          XINAO
        </div>
        <div style={{ width: 22, height: 1, background: T.gold, margin: '0 auto 7px' }} />
        <div style={{ fontSize: 8, letterSpacing: '0.3em', color: T.n600, fontFamily: 'sans-serif', marginBottom: 40 }}>
          INVITE SYSTEM
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roles.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                padding: '18px 20px', background: '#111', border: '1px solid #1A1A1A',
                borderRadius: 4, cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1A1A1A')}
            >
              <span style={{ fontSize: 20, color: T.gold, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.white, letterSpacing: '0.14em', fontFamily: 'sans-serif', marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 11, color: T.n400, fontFamily: 'sans-serif' }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 14, color: T.n600 }}>→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
