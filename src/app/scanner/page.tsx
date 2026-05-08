'use client'
import { useState } from 'react'
import { TopBar } from '@/components/TopBar'
import { THEME as T, fmtTime } from '@/lib/utils'

const MOCK_EVENTS = [
  { id:'evt-001', name:'Threads of Connection', date:'24 JUNE 2026' },
  { id:'evt-002', name:'Native Soul Collection', date:'15 SEPTEMBER 2026' },
]
const MOCK_GUESTS = [
  { id:'g001', event_id:'evt-001', first_name:'Marco',     last_name:'Conti',      status:'registered',  qr_token:'qr-x1y2z3', checked_in_at:null },
  { id:'g002', event_id:'evt-001', first_name:'Sophia',    last_name:'Martini',    status:'registered',  qr_token:'qr-a4b5c6', checked_in_at:null },
  { id:'g005', event_id:'evt-001', first_name:'Luca',      last_name:'Ferragamo',  status:'checked-in',  qr_token:'qr-j4k5l6', checked_in_at:'2026-06-24T20:15:00Z' },
  { id:'g006', event_id:'evt-001', first_name:'Charlotte', last_name:'Dubois',     status:'registered',  qr_token:'qr-m7n8o9', checked_in_at:null },
  { id:'g007', event_id:'evt-002', first_name:'Alessandro',last_name:'Ferrari',    status:'registered',  qr_token:'qr-p1q2r3', checked_in_at:null },
]

type ScanResult = { type:'success'|'already'|'invalid'; guest?: typeof MOCK_GUESTS[number] & {checked_in_at:string|null} }

export default function ScannerPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [guests, setGuests] = useState(MOCK_GUESTS)
  const [result, setResult] = useState<ScanResult|null>(null)
  const [token, setToken] = useState('')
  const [scanning, setScanning] = useState(false)

  const eventGuests = guests.filter(g => g.event_id === selectedEventId)

  const checkQR = (qr: string) => {
    const g = eventGuests.find(x => x.qr_token === qr)
    if (!g) return setResult({ type:'invalid' })
    if (g.status === 'checked-in') return setResult({ type:'already', guest: g as any })
    const now = new Date().toISOString()
    setGuests(p => p.map(x => x.id===g.id ? {...x, status:'checked-in', checked_in_at:now} : x))
    setResult({ type:'success', guest: {...g, status:'checked-in', checked_in_at:now} })
  }

  const simulate = () => {
    if (!selectedEventId) return
    setScanning(true)
    setTimeout(()=>{
      const el = eventGuests.filter(g => g.status === 'registered')
      if (el.length) checkQR(el[Math.floor(Math.random()*el.length)].qr_token)
      else setResult({ type:'invalid' })
      setScanning(false)
    }, 1000)
  }

  const RES = {
    success: { bg:'#061606', border:'#2D6B2D', color:'#7EC87E', icon:'✓', label:'ACCESS GRANTED' },
    already: { bg:'#160606', border:T.red,     color:'#E57E7E', icon:'⚠', label:'ALREADY CHECKED IN' },
    invalid: { bg:'#160606', border:T.red,     color:'#E57E7E', icon:'✕', label:'INVALID INVITATION' },
  }

  return (
    <div style={{ fontFamily:"'Georgia',serif", minHeight:'100vh', background:T.black }}>
      <TopBar section="EVENT SCANNER" backHref="/" />
      <div style={{ background:'#111', padding:'8px 16px', display:'flex', gap:10, alignItems:'center', borderBottom:'1px solid #1A1A1A', flexWrap:'wrap' }}>
        <span style={{ fontSize:8, letterSpacing:'0.22em', color:T.n600, fontFamily:'sans-serif' }}>EVENT:</span>
        <select value={selectedEventId} onChange={e=>{ setSelectedEventId(e.target.value); setResult(null); }} style={{ padding:'4px 9px', background:'#1A1A1A', border:'1px solid #2A2520', borderRadius:2, fontSize:12, fontFamily:'sans-serif', color:'#FAFAF8' }}>
          <option value="" disabled>Select event…</option>
          {MOCK_EVENTS.map(e=><option key={e.id} value={e.id}>{e.name} — {e.date}</option>)}
        </select>
      </div>

      {!selectedEventId ? (
        <div style={{ textAlign:'center', padding:80, color:T.n400, fontFamily:'sans-serif', fontSize:13 }}>Select an event above to open the scanner.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 16px' }}>
          <div style={{ width:'100%', maxWidth:320 }}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ fontSize:9, color:T.gold, letterSpacing:'0.3em', fontFamily:'sans-serif', marginBottom:4 }}>XINAO EVENT STAFF</div>
              <div style={{ fontSize:16, color:'#FAFAF8', fontFamily:"'Georgia',serif", fontWeight:700 }}>QR SCANNER</div>
              <div style={{ fontSize:9, color:T.n400, marginTop:2, letterSpacing:'0.1em', fontFamily:'sans-serif' }}>
                {MOCK_EVENTS.find(e=>e.id===selectedEventId)?.name.toUpperCase()}
              </div>
            </div>
            <div style={{ width:'100%', aspectRatio:'1', background:'#111', border:`1px solid ${scanning?T.gold:'#1A1A1A'}`, borderRadius:4, marginBottom:12, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.3s' }}>
              {[[0,0],[0,1],[1,0],[1,1]].map(([tr,tc],i)=>(
                <div key={i} style={{ position:'absolute', top:tr?'auto':'12px', bottom:tr?'12px':'auto', left:tc?'auto':'12px', right:tc?'12px':'auto', width:18, height:18, borderTop:tr?'none':`2px solid ${T.gold}`, borderBottom:tr?`2px solid ${T.gold}`:'none', borderLeft:tc?'none':`2px solid ${T.gold}`, borderRight:tc?`2px solid ${T.gold}`:'none' }}/>
              ))}
              {scanning
                ? <div style={{ textAlign:'center' }}><div style={{ fontSize:26, color:T.gold, animation:'spin 1s linear infinite' }}>◎</div><div style={{ fontSize:9, color:T.n400, marginTop:5, letterSpacing:'0.15em', fontFamily:'sans-serif' }}>SCANNING…</div></div>
                : <div style={{ textAlign:'center' }}><div style={{ fontSize:32, color:'#1A1A1A' }}>⊟</div><div style={{ fontSize:9, color:'#5C5650', marginTop:5, letterSpacing:'0.1em', fontFamily:'sans-serif' }}>POINT CAMERA AT QR CODE</div></div>
              }
            </div>
            <button onClick={simulate} disabled={scanning} style={{ width:'100%', padding:'13px 0', background:scanning?T.n800:T.gold, color:T.black, border:'none', borderRadius:2, cursor:scanning?'not-allowed':'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.18em', fontFamily:'sans-serif', marginBottom:10 }}>
              {scanning ? 'SCANNING…' : 'SIMULATE CAMERA SCAN'}
            </button>
            <div style={{ display:'flex', gap:7, marginBottom:18 }}>
              <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Enter QR token manually"
                onKeyDown={e=>e.key==='Enter'&&checkQR(token.trim())}
                style={{ flex:1, padding:'10px 11px', background:'#111', border:'1px solid #2A2520', borderRadius:2, color:'#FAFAF8', fontSize:12, fontFamily:'sans-serif', outline:'none', minWidth:0 }}/>
              <button onClick={()=>checkQR(token.trim())} style={{ padding:'10px 12px', background:'#1A1A1A', border:'1px solid #2A2520', borderRadius:2, color:T.n400, cursor:'pointer', fontSize:11, fontFamily:'sans-serif', flexShrink:0 }}>CHECK</button>
            </div>
            {result && (() => {
              const R = RES[result.type]
              return (
                <div style={{ padding:18, background:R.bg, border:`1px solid ${R.border}`, borderRadius:4, textAlign:'center' }}>
                  <div style={{ fontSize:32, color:R.color, marginBottom:6 }}>{R.icon}</div>
                  <div style={{ fontSize:11, color:R.color, letterSpacing:'0.18em', fontFamily:'sans-serif', fontWeight:700 }}>{R.label}</div>
                  {result.guest && <div style={{ fontSize:16, color:'#FAFAF8', fontFamily:"'Georgia',serif", marginTop:5 }}>{result.guest.first_name} {result.guest.last_name}</div>}
                  {result.type==='already'&&result.guest?.checked_in_at&&<div style={{ fontSize:10, color:T.n400, marginTop:3, fontFamily:'sans-serif' }}>Checked in at {fmtTime(result.guest.checked_in_at)}</div>}
                  <button onClick={()=>{setResult(null);setToken('')}} style={{ marginTop:10, padding:'7px 16px', background:'transparent', border:'1px solid #2A2520', color:T.n400, cursor:'pointer', borderRadius:2, fontSize:9, letterSpacing:'0.18em', fontFamily:'sans-serif' }}>SCAN NEXT</button>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
