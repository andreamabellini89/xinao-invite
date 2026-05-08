'use client'
import { useRouter } from 'next/navigation'
import { THEME as T } from '@/lib/utils'

interface Props {
  section: string
  backHref?: string
  onBack?: () => void
}

export function TopBar({ section, backHref, onBack }: Props) {
  const router = useRouter()

  const handleLogoClick = () => {
    if (onBack) { onBack(); return; }
    if (backHref) router.push(backHref)
    else router.push('/')
  }

  return (
    <div style={{ background: T.black, borderBottom: '1px solid #161616', padding: '0 16px', position: 'sticky', top: 0, zIndex: 200 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 46 }}>
        <button onClick={handleLogoClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, padding: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.gold, letterSpacing: '0.12em', fontFamily: "'Georgia',serif" }}>XINAO</span>
          <span style={{ width: 1, height: 11, background: '#2A2520', display: 'block' }} />
          <span style={{ fontSize: 8, color: T.n600, letterSpacing: '0.22em', fontFamily: 'sans-serif' }}>{section}</span>
        </button>
        <button
          onClick={() => router.push('/')}
          style={{ padding: '4px 11px', background: 'none', border: '1px solid #2A2520', borderRadius: 2, cursor: 'pointer', fontSize: 9, letterSpacing: '0.14em', fontFamily: 'sans-serif', color: T.n600 }}
        >
          ← BACK
        </button>
      </div>
    </div>
  )
}
