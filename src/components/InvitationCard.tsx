'use client'
import { useRef, useState } from 'react'
import { QRCode } from './QRCode'
import { THEME as T } from '@/lib/utils'

interface Guest { id:string; first_name:string; last_name:string; qr_token:string; [k:string]:any }
interface Event { id:string; name:string; subtitle?:string|null; date:string; time:string; location:string; address?:string|null; description?:string|null; cover_image_url?:string|null; [k:string]:any }

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao.com'

export function InvitationCard({ guest, event, showDownload=false }: { guest:Guest; event:Event; showDownload?:boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const name = `${guest.first_name} ${guest.last_name}`.toUpperCase()
  const qrVal = `${SITE}/checkin/${event.id}/${guest.qr_token}`
  const words = event.name.toUpperCase().split(' ')
  const mid = Math.ceil(words.length / 2)
  const line1 = words.slice(0, mid).join(' ')
  const line2 = words.slice(mid).join(' ')
  const cardBg = '#F8F5EF'

  // ── High-res PNG export ──
  const downloadPNG = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,  // 3x = high-res, ~1500px wide on a 500px card
        backgroundColor: cardBg,
      })
      const a = document.createElement('a')
      a.download = `xinao-invitation-${guest.last_name.toLowerCase()}-${guest.id.slice(0,6)}.png`
      a.href = dataUrl
      a.click()
    } catch (e) { console.error(e) }
    setExporting(false)
  }

  // ── PDF export ──
  const downloadPDF = async () => {
    if (!cardRef.current) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const { jsPDF } = await import('jspdf')

      const dataUrl = await toPng(cardRef.current, { quality: 1, pixelRatio: 3, backgroundColor: cardBg })

      // A5 portrait in mm: 148 x 210
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()

      // Add image centered on page
      pdf.addImage(dataUrl, 'PNG', 0, 0, pageW, pageH)
      pdf.save(`xinao-invitation-${guest.last_name.toLowerCase()}-${guest.id.slice(0,6)}.pdf`)
    } catch (e) { console.error(e) }
    setExporting(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* ── Invitation card ── */}
      <div ref={cardRef} style={{
        width:'100%', maxWidth:480,
        background: cardBg,
        border: '1px solid #E0D8CC',
        borderRadius: 4,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '48px 40px 44px',
        fontFamily: "'Georgia','Times New Roman',serif",
        boxSizing: 'border-box',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background image overlay */}
        {event.cover_image_url && (
          <img src={event.cover_image_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.1, zIndex:0 }}/>
        )}

        <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* Top rule */}
          <div style={{ width:32, height:1, background:T.gold, marginBottom:32 }}/>

          {/* XINAO Logo */}
          <div style={{ textAlign:'center', marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <span style={{ fontSize:34, fontWeight:900, color:T.gold, letterSpacing:'0.04em', fontStyle:'italic' }}>X</span>
              <span style={{ fontSize:34, fontWeight:900, color:T.gold, letterSpacing:'0.04em' }}>INAO</span>
              {event.subtitle && (
                <span style={{ fontSize:13, fontWeight:700, color:T.gold, border:`2px solid ${T.gold}`, borderRadius:5, padding:'2px 7px', fontFamily:'sans-serif', marginLeft:4 }}>35</span>
              )}
            </div>
            {event.subtitle && <div style={{ fontSize:13, color:T.gold, fontStyle:'italic', letterSpacing:'0.1em', marginTop:4 }}>{event.subtitle}</div>}
          </div>

          <div style={{ width:28, height:1, background:T.gold, margin:'22px auto' }}/>

          {/* PERSONAL INVITATION */}
          <div style={{ fontSize:11, letterSpacing:'0.38em', color:T.gold, fontFamily:'sans-serif', marginBottom:20 }}>PERSONAL INVITATION</div>

          {/* Guest name */}
          <div style={{ fontSize:14, letterSpacing:'0.14em', color:'#5C5650', fontFamily:'sans-serif', marginBottom:8 }}>DEAR</div>
          <div style={{ fontSize:26, fontWeight:700, color:'#1A1008', letterSpacing:'0.07em', textAlign:'center', lineHeight:1.15, marginBottom:32 }}>{name}</div>

          {/* FINAL REMINDER */}
          <div style={{ fontSize:11, letterSpacing:'0.38em', color:T.gold, fontFamily:'sans-serif', marginBottom:14 }}>FINAL REMINDER</div>

          {/* Event title */}
          <div style={{ fontSize:48, fontWeight:900, color:'#1A1008', lineHeight:1.0, textAlign:'center', marginBottom:2, letterSpacing:'-0.01em' }}>{line1}</div>
          {line2 && <div style={{ fontSize:48, fontWeight:900, color:'#1A1008', lineHeight:1.0, textAlign:'center', marginBottom:16, letterSpacing:'-0.01em' }}>{line2}</div>}

          {/* Tagline */}
          {event.description && <div style={{ fontSize:13, color:T.gold, fontStyle:'italic', letterSpacing:'0.07em', textAlign:'center', marginBottom:4 }}>{event.description}</div>}

          <div style={{ width:28, height:1, background:T.gold, margin:'22px auto' }}/>

          {/* Welcome */}
          <div style={{ fontSize:15, color:'#3A3028', textAlign:'center', lineHeight:1.8, marginBottom:26, fontFamily:"'Georgia',serif" }}>
            We look forward to welcoming you<br/>to the {event.subtitle ?? event.name}.
          </div>

          {/* Date */}
          <div style={{ fontSize:14, color:T.gold, fontWeight:700, letterSpacing:'0.22em', fontFamily:'sans-serif', marginBottom:10 }}>
            {event.date} — {event.time}
          </div>

          {/* Location */}
          <div style={{ fontSize:14, fontWeight:700, letterSpacing:'0.18em', color:'#1A1008', fontFamily:'sans-serif', marginBottom:5 }}>{event.location}</div>
          {event.address && <div style={{ fontSize:12, letterSpacing:'0.1em', color:'#8A8078', fontFamily:'sans-serif', textAlign:'center' }}>{event.address}</div>}

          <div style={{ width:28, height:1, background:T.gold, margin:'22px auto' }}/>

          {/* QR instruction */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
            <div style={{ width:36, height:36, border:`1.5px solid #A09890`, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', color:'#A09890', fontSize:16, flexShrink:0 }}>⊟</div>
            <div style={{ fontSize:10, letterSpacing:'0.22em', color:'#5C5650', fontFamily:'sans-serif', lineHeight:1.5 }}>PLEASE PRESENT QR CODE<br/>UPON ARRIVAL</div>
          </div>

          {/* QR Code — larger, high contrast */}
          <div style={{ background:'#fff', padding:12, borderRadius:4 }}>
            <QRCode value={qrVal} size={140} color="#1A1008" bg="#ffffff"/>
          </div>

          {/* Short code below QR */}
          <div style={{ marginTop:10, fontSize:14, fontFamily:'monospace', fontWeight:700, color:T.gold, letterSpacing:'0.2em' }}>
            {guest.qr_token.slice(0,8).toUpperCase()}
          </div>

          <div style={{ width:28, height:1, background:T.gold, margin:'20px auto' }}/>

          <div style={{ fontSize:11, letterSpacing:'0.45em', color:T.gold, fontFamily:'sans-serif' }}>THANK YOU</div>
        </div>
      </div>

      {/* ── Download buttons ── */}
      {showDownload && (
        <div style={{ display:'flex', gap:10, marginTop:18, flexWrap:'wrap', justifyContent:'center' }}>
          <button onClick={downloadPNG} disabled={exporting}
            style={{ padding:'12px 24px', background:T.gold, color:'#fff', border:'none', borderRadius:2, cursor:exporting?'wait':'pointer', fontSize:11, letterSpacing:'0.2em', fontFamily:'sans-serif', fontWeight:700 }}>
            {exporting ? 'EXPORTING…' : '⬇ DOWNLOAD PNG'}
          </button>
          <button onClick={downloadPDF} disabled={exporting}
            style={{ padding:'12px 24px', background:T.n800, color:'#fff', border:'none', borderRadius:2, cursor:exporting?'wait':'pointer', fontSize:11, letterSpacing:'0.2em', fontFamily:'sans-serif', fontWeight:700 }}>
            {exporting ? 'EXPORTING…' : '⬇ DOWNLOAD PDF'}
          </button>
        </div>
      )}
    </div>
  )
}
