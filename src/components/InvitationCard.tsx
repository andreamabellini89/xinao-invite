'use client'
import { useRef } from 'react'
import { toPng } from 'html-to-image'
import { Guest, XinaoEvent } from '@/types'
import { QRCode } from './QRCode'
import { THEME as T } from '@/lib/utils'

interface Props {
  guest: Guest
  event: XinaoEvent
  showDownload?: boolean
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao.com'

export function InvitationCard({ guest, event, showDownload = false }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const name = `${guest.first_name} ${guest.last_name}`.toUpperCase()
  const qrVal = `${siteUrl}/checkin/${event.id}/${guest.qr_token}`
  const words = event.name.split(' ')
  const half = Math.ceil(words.length / 2)
  const hasCover = !!event.cover_image_url

  const download = async () => {
    if (!cardRef.current) return
    try {
      const dataUrl = await toPng(cardRef.current, { quality: 0.95 })
      const link = document.createElement('a')
      link.download = `xinao-invitation-${guest.last_name.toLowerCase()}.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Download failed:', e)
    }
  }

  return (
    <div>
      <div
        ref={cardRef}
        style={{
          width: '100%', maxWidth: 380,
          background: hasCover ? 'transparent' : '#F8F5EF',
          border: hasCover ? 'none' : '1px solid #E8E2D8',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '32px 24px 28px',
          fontFamily: "'Georgia','Times New Roman',serif",
          boxSizing: 'border-box', position: 'relative',
          overflow: 'hidden', borderRadius: hasCover ? 6 : 2,
          minHeight: hasCover ? 560 : 0,
        }}
      >
        {hasCover && (
          <img
            src={event.cover_image_url!}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.15 }}
          />
        )}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ width: 20, height: 1, background: T.gold, marginBottom: 18 }} />
          <div style={{ textAlign: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: T.gold, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span style={{ fontStyle: 'italic' }}>X</span><span>INAO</span>
              {event.subtitle && <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, border: `1.5px solid ${T.gold}`, borderRadius: 4, padding: '1px 4px', fontFamily: 'sans-serif' }}>35</span>}
            </span>
            {event.subtitle && <div style={{ fontSize: 9, color: T.gold, fontStyle: 'italic', letterSpacing: '0.15em', marginTop: 2 }}>{event.subtitle}</div>}
          </div>
          <div style={{ width: 14, height: 1, background: T.gold, margin: '10px auto' }} />
          <div style={{ fontSize: 8, letterSpacing: '0.35em', color: T.gold, fontFamily: 'sans-serif', marginBottom: 10 }}>PERSONAL INVITATION</div>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: T.n600, fontFamily: 'sans-serif', marginBottom: 2 }}>DEAR</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.n800, letterSpacing: '0.1em', textAlign: 'center', lineHeight: 1.2, marginBottom: 14 }}>{name}</div>
          <div style={{ fontSize: 7, letterSpacing: '0.35em', color: T.gold, fontFamily: 'sans-serif', marginBottom: 6 }}>FINAL REMINDER</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.n800, lineHeight: 1.05, textAlign: 'center', marginBottom: 1 }}>
            {words.slice(0, half).join(' ').toUpperCase()}
          </div>
          {words.length > 1 && (
            <div style={{ fontSize: 22, fontWeight: 700, color: T.n800, lineHeight: 1.05, textAlign: 'center', marginBottom: 7 }}>
              {words.slice(half).join(' ').toUpperCase()}
            </div>
          )}
          {event.description && <div style={{ fontSize: 8, color: T.gold, fontStyle: 'italic', letterSpacing: '0.08em', marginBottom: 2 }}>{event.description}</div>}
          <div style={{ width: 14, height: 1, background: T.gold, margin: '10px auto' }} />
          <div style={{ fontSize: 10, color: T.n600, textAlign: 'center', lineHeight: 1.7, marginBottom: 12 }}>
            We look forward to welcoming you<br />to the {event.subtitle ?? event.name}.
          </div>
          <div style={{ fontSize: 9, color: T.gold, fontWeight: 700, letterSpacing: '0.15em', fontFamily: 'sans-serif', marginBottom: 3 }}>
            {event.date} — {event.time}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: T.n800, fontFamily: 'sans-serif', marginBottom: 2 }}>{event.location}</div>
          {event.address && <div style={{ fontSize: 8, letterSpacing: '0.06em', color: T.n400, fontFamily: 'sans-serif' }}>{event.address}</div>}
          <div style={{ width: 14, height: 1, background: T.gold, margin: '10px auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <div style={{ width: 22, height: 22, border: `1.5px solid ${T.n400}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.n400, fontSize: 9 }}>⊟</div>
            <div style={{ fontSize: 7, letterSpacing: '0.18em', color: T.n600, fontFamily: 'sans-serif' }}>PLEASE PRESENT QR CODE UPON ARRIVAL</div>
          </div>
          <QRCode value={qrVal} size={70} color={T.gold} bg="#F8F5EF" />
          <div style={{ width: 14, height: 1, background: T.gold, margin: '10px auto' }} />
          <div style={{ fontSize: 8, letterSpacing: '0.4em', color: T.gold, fontFamily: 'sans-serif' }}>THANK YOU</div>
        </div>
      </div>

      {showDownload && (
        <button
          onClick={download}
          style={{
            marginTop: 14, padding: '11px 22px', background: T.gold, color: T.white,
            border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 10,
            letterSpacing: '0.18em', fontFamily: 'sans-serif', fontWeight: 700,
          }}
        >
          ⬇ DOWNLOAD INVITATION
        </button>
      )}
    </div>
  )
}
