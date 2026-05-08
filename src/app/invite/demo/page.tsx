'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { THEME as T } from '@/lib/utils'

const DEMO_GUESTS = [
  { name:'James Richardson (invited)',   url:'/invite/evt-001/tok-g7h8i9' },
  { name:'Elena Vasquez (invited)',      url:'/invite/evt-001/tok-j1k2l3' },
  { name:'Marco Conti (registered)',     url:'/invite/evt-001/tok-a1b2c3' },
  { name:'Yuki Tanaka (invited) evt-2',  url:'/invite/evt-002/tok-v4w5x6' },
]

export default function GuestDemoPage() {
  const router = useRouter()
  const [selected, setSelected] = useState(DEMO_GUESTS[0].url)

  return (
    <div style={{ fontFamily:"'Georgia',serif", minHeight:'100vh', background:T.n100 }}>
      <TopBar section="GUEST PORTAL" backHref="/" />
      <div style={{ background:'#1A1000', borderBottom:`2px solid ${T.gold}`, padding:'10px 16px', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <span style={{ fontSize:9, letterSpacing:'0.2em', color:T.gold, fontFamily:'sans-serif', fontWeight:700 }}>🔍 DEMO MODE</span>
        <span style={{ fontSize:9, color:T.goldLight, fontFamily:'sans-serif' }}>Select guest to preview their registration experience:</span>
        <select value={selected} onChange={e=>setSelected(e.target.value)} style={{ padding:'5px 10px', background:'#111', border:`1px solid ${T.gold}`, borderRadius:2, fontSize:12, fontFamily:'sans-serif', color:T.gold, cursor:'pointer' }}>
          {DEMO_GUESTS.map(g=><option key={g.url} value={g.url}>{g.name}</option>)}
        </select>
        <button onClick={()=>router.push(selected)} style={{ padding:'6px 14px', background:T.gold, color:T.black, border:'none', borderRadius:2, cursor:'pointer', fontSize:10, fontWeight:700, letterSpacing:'0.15em', fontFamily:'sans-serif' }}>
          OPEN →
        </button>
      </div>
      <div style={{ maxWidth:500, margin:'60px auto', padding:'0 16px', textAlign:'center' }}>
        <div style={{ fontSize:9, letterSpacing:'0.3em', color:T.gold, fontFamily:'sans-serif', marginBottom:16 }}>GUEST PORTAL</div>
        <div style={{ fontSize:20, fontFamily:"'Georgia',serif", fontWeight:700, color:T.n800, marginBottom:12 }}>Select a guest above to preview their invitation experience.</div>
        <div style={{ fontSize:12, color:T.n400, fontFamily:'sans-serif', lineHeight:1.7 }}>
          In production, each guest receives a unique URL like:<br/>
          <code style={{ fontSize:11, color:T.gold, display:'block', marginTop:8, background:T.n100, padding:'6px 10px', borderRadius:3 }}>
            yourdomain.com/invite/[eventId]/[guestToken]
          </code>
        </div>
      </div>
    </div>
  )
}
