'use client'
import { useRef, useState, useEffect } from 'react'
import { THEME as T } from '@/lib/utils'

interface Guest { id:string; first_name:string; last_name:string; qr_token:string; [k:string]:any }
interface Event { id:string; name:string; subtitle?:string|null; date:string; time:string; location:string; address?:string|null; description?:string|null; cover_image_url?:string|null; [k:string]:any }

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao-invite.vercel.app'

// ── Real QR Code using qrcode library ─────────────────────────────────────────
function RealQRCode({ value, size=140 }: { value:string; size?:number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const render = async () => {
      try {
        const QRCode = (await import('qrcode')).default
        if (!canvasRef.current || cancelled) return
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: { dark: '#1A1008', light: '#FFFFFF' },
          errorCorrectionLevel: 'H',
        })
        if (!cancelled) setReady(true)
      } catch (e) {
        console.error('QR generation failed:', e)
      }
    }
    render()
    return () => { cancelled = true }
  }, [value, size])

  return (
    <div style={{ background:'#fff', padding:10, borderRadius:4, display:'inline-block' }}>
      <canvas ref={canvasRef} style={{ display:'block', opacity: ready ? 1 : 0, transition:'opacity 0.3s' }}/>
      {!ready && (
        <div style={{ width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff' }}>
          <div style={{ fontSize:9, color:'#A09890', fontFamily:'sans-serif' }}>Loading QR…</div>
        </div>
      )}
    </div>
  )
}

export function InvitationCard({ guest, event, showDownload=false }: { guest:Guest; event:Event; showDownload?:boolean }) {
  const cardRef  = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportMsg, setExportMsg] = useState('')

  const name   = `${guest.first_name} ${guest.last_name}`.toUpperCase()
  const qrVal  = `${SITE}/checkin/${event.id}/${guest.qr_token}`
  const words  = event.name.toUpperCase().split(' ')
  const mid    = Math.ceil(words.length / 2)
  const line1  = words.slice(0, mid).join(' ')
  const line2  = words.slice(mid).join(' ')
  const cardBg = '#F8F5EF'
  const shortCode = guest.qr_token.slice(0, 8).toUpperCase()

  // ── PNG export ──
  const downloadPNG = async () => {
    if (!cardRef.current) return
    setExporting(true); setExportMsg('Generating PNG…')
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: cardBg,
        skipFonts: false,
      })
      const a = document.createElement('a')
      a.download = `xinao-invitation-${guest.last_name.toLowerCase()}.png`
      a.href = dataUrl
      a.click()
      setExportMsg('')
    } catch (e) {
      console.error(e)
      setExportMsg('Export failed. Try again.')
    }
    setExporting(false)
  }

  // ── PDF export — correct A5 proportions ──
  const downloadPDF = async () => {
    if (!cardRef.current) return
    setExporting(true); setExportMsg('Generating PDF…')
    try {
      const { toPng }   = await import('html-to-image')
      const { jsPDF }   = await import('jspdf')

      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: cardBg,
      })

      // Get actual card dimensions to preserve proportions
      const rect    = cardRef.current.getBoundingClientRect()
      const aspect  = rect.height / rect.width

      // A5 width = 148mm — calculate height from actual card aspect ratio
      const pdfW = 148
      const pdfH = pdfW * aspect

      const pdf = new jsPDF({
        orientation: pdfH > pdfW ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfW, pdfH],
      })

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`xinao-invitation-${guest.last_name.toLowerCase()}.pdf`)
      setExportMsg('')
    } catch (e) {
      console.error(e)
      setExportMsg('PDF export failed. Try again.')
    }
    setExporting(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:'100%' }}>

      {/* ── Card ── */}
      <div ref={cardRef} style={{
        width: '100%',
        maxWidth: 460,
        background: cardBg,
        border: '1px solid #E0D8CC',
        borderRadius: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '44px 36px 40px',
        fontFamily: "'Georgia','Times New Roman',serif",
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {event.cover_image_url && (
          <img src={event.cover_image_url} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.08, zIndex:0 }}/>
        )}

        <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>

          {/* Top rule */}
          <div style={{ width:28, height:1, background:T.gold, marginBottom:28 }}/>

          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:6 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
              <span style={{ fontSize:32, fontWeight:900, color:T.gold, fontStyle:'italic' }}>X</span>
              <span style={{ fontSize:32, fontWeight:900, color:T.gold, letterSpacing:'0.04em' }}>INAO</span>
              {event.subtitle && (
                <span style={{ fontSize:12, fontWeight:700, color:T.gold, border:`2px solid ${T.gold}`, borderRadius:5, padding:'2px 6px', fontFamily:'sans-serif', marginLeft:4 }}>35</span>
              )}
            </div>
            {event.subtitle && <div style={{ fontSize:12, color:T.gold, fontStyle:'italic', letterSpacing:'0.1em', marginTop:4 }}>{event.subtitle}</div>}
          </div>

          <div style={{ width:24, height:1, background:T.gold, margin:'20px auto' }}/>
          <div style={{ fontSize:10, letterSpacing:'0.38em', color:T.gold, fontFamily:'sans-serif', marginBottom:18 }}>PERSONAL INVITATION</div>

          {/* Guest name */}
          <div style={{ fontSize:13, letterSpacing:'0.14em', color:'#5C5650', fontFamily:'sans-serif', marginBottom:8 }}>DEAR</div>
          <div style={{ fontSize:24, fontWeight:700, color:'#1A1008', letterSpacing:'0.07em', textAlign:'center', lineHeight:1.15, marginBottom:28 }}>{name}</div>

          <div style={{ fontSize:10, letterSpacing:'0.38em', color:T.gold, fontFamily:'sans-serif', marginBottom:12 }}>FINAL REMINDER</div>

          {/* Event title */}
          <div style={{ fontSize:44, fontWeight:900, color:'#1A1008', lineHeight:1.0, textAlign:'center', marginBottom:2, letterSpacing:'-0.01em' }}>{line1}</div>
          {line2 && <div style={{ fontSize:44, fontWeight:900, color:'#1A1008', lineHeight:1.0, textAlign:'center', marginBottom:14, letterSpacing:'-0.01em' }}>{line2}</div>}

          {event.description && <div style={{ fontSize:12, color:T.gold, fontStyle:'italic', letterSpacing:'0.07em', textAlign:'center', marginBottom:4 }}>{event.description}</div>}

          <div style={{ width:24, height:1, background:T.gold, margin:'20px auto' }}/>

          <div style={{ fontSize:14, color:'#3A3028', textAlign:'center', lineHeight:1.8, marginBottom:24 }}>
            We look forward to welcoming you<br/>to the {event.subtitle ?? event.name}.
          </div>

          <div style={{ fontSize:13, color:T.gold, fontWeight:700, letterSpacing:'0.22em', fontFamily:'sans-serif', marginBottom:8 }}>
            {event.date} — {event.time}
          </div>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:'0.18em', color:'#1A1008', fontFamily:'sans-serif', marginBottom:4 }}>{event.location}</div>
          {event.address && <div style={{ fontSize:11, letterSpacing:'0.1em', color:'#8A8078', fontFamily:'sans-serif', textAlign:'center' }}>{event.address}</div>}

          <div style={{ width:24, height:1, background:T.gold, margin:'20px auto' }}/>

          {/* QR instruction */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:34, height:34, border:'1.5px solid #A09890', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', color:'#A09890', fontSize:15, flexShrink:0 }}>⊟</div>
            <div style={{ fontSize:9, letterSpacing:'0.22em', color:'#5C5650', fontFamily:'sans-serif', lineHeight:1.5 }}>PLEASE PRESENT QR CODE<br/>UPON ARRIVAL</div>
          </div>

          {/* REAL QR Code */}
          <RealQRCode value={qrVal} size={140}/>

          {/* Short code */}
          <div style={{ marginTop:10, fontSize:14, fontFamily:'monospace', fontWeight:700, color:T.gold, letterSpacing:'0.2em' }}>
            {shortCode}
          </div>

          <div style={{ width:24, height:1, background:T.gold, margin:'18px auto' }}/>
          <div style={{ fontSize:10, letterSpacing:'0.45em', color:T.gold, fontFamily:'sans-serif' }}>THANK YOU</div>
        </div>
      </div>

      {/* ── Download buttons ── */}
      {showDownload && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginTop:18, width:'100%', maxWidth:460 }}>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
            <button onClick={downloadPNG} disabled={exporting}
              style={{ padding:'13px 28px', background:T.gold, color:'#fff', border:'none', borderRadius:2, cursor:exporting?'wait':'pointer', fontSize:11, letterSpacing:'0.2em', fontFamily:'sans-serif', fontWeight:700, minWidth:180 }}>
              {exporting ? exportMsg : '⬇ DOWNLOAD PNG'}
            </button>
            <button onClick={downloadPDF} disabled={exporting}
              style={{ padding:'13px 28px', background:T.n800, color:'#fff', border:'none', borderRadius:2, cursor:exporting?'wait':'pointer', fontSize:11, letterSpacing:'0.2em', fontFamily:'sans-serif', fontWeight:700, minWidth:180 }}>
              {exporting ? exportMsg : '⬇ DOWNLOAD PDF'}
            </button>
          </div>
          {exportMsg && <div style={{ fontSize:11, color:T.n400, fontFamily:'sans-serif' }}>{exportMsg}</div>}
        </div>
      )}
    </div>
  )
}
