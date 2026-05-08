'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { Badge } from '@/components/Badge'
import { InvitationCard } from '@/components/InvitationCard'
import { THEME as T, fmtDate, fmtTime } from '@/lib/utils'
import type { XinaoEvent, Guest } from '@/types'

// Mock data — in production fetch from Supabase using params.eventId
const MOCK_EVENTS: XinaoEvent[] = [
  { id:'evt-001', name:'Threads of Connection', subtitle:'35th Anniversary', date:'24 JUNE 2026', time:'8:00 PM', location:'GIARDINO CORSINI', address:'VIA DELLA SCALA 115, FLORENCE, ITALY', description:'Art · Yarn · Nature · Contemporary Culture', status:'upcoming', cover_image_url:null, created_at:'', updated_at:'' },
  { id:'evt-002', name:'Native Soul Collection', subtitle:'Winter Preview 2026', date:'15 SEPTEMBER 2026', time:'7:30 PM', location:'PALAZZO STROZZI', address:'PIAZZA DEGLI STROZZI, FLORENCE, ITALY', description:'Cashmere · Heritage · Innovation', status:'upcoming', cover_image_url:null, created_at:'', updated_at:'' },
]
const MOCK_GUESTS: Guest[] = [
  { id:'g001', event_id:'evt-001', first_name:'Marco',     last_name:'Conti',      email:'m.conti@luxfashion.it',    phone:null, status:'registered',  guest_token:'tok-a1b2', qr_token:'qr-x1y2', registered_at:'2026-05-10T14:32:00Z', checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g002', event_id:'evt-001', first_name:'Sophia',    last_name:'Martini',    email:'s.martini@vogue.it',       phone:null, status:'registered',  guest_token:'tok-d4e5', qr_token:'qr-a4b5', registered_at:'2026-05-11T09:15:00Z', checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g003', event_id:'evt-001', first_name:'James',     last_name:'Richardson', email:'j.rich@sothebys.com',      phone:null, status:'invited',     guest_token:'tok-g7h8', qr_token:'qr-d7e8', registered_at:null, checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g004', event_id:'evt-001', first_name:'Elena',     last_name:'Vasquez',    email:'e.vasquez@hermes.fr',      phone:null, status:'invited',     guest_token:'tok-j1k2', qr_token:'qr-g1h2', registered_at:null, checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g005', event_id:'evt-001', first_name:'Luca',      last_name:'Ferragamo',  email:'l.ferragamo@ferragamo.com',phone:null, status:'checked-in',  guest_token:'tok-m4n5', qr_token:'qr-j4k5', registered_at:'2026-05-08T16:00:00Z', checked_in_at:'2026-06-24T20:15:00Z', created_at:'', updated_at:'' },
  { id:'g006', event_id:'evt-001', first_name:'Charlotte', last_name:'Dubois',     email:'c.dubois@lvmh.fr',         phone:null, status:'registered',  guest_token:'tok-p7q8', qr_token:'qr-m7n8', registered_at:'2026-05-12T11:30:00Z', checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g007', event_id:'evt-002', first_name:'Alessandro',last_name:'Ferrari',    email:'a.ferrari@maxmara.com',    phone:null, status:'registered',  guest_token:'tok-s1t2', qr_token:'qr-p1q2', registered_at:'2026-05-15T10:00:00Z', checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g008', event_id:'evt-002', first_name:'Yuki',      last_name:'Tanaka',     email:'y.tanaka@isseymiyake.jp',  phone:null, status:'invited',     guest_token:'tok-v4w5', qr_token:'qr-s4t5', registered_at:null, checked_in_at:null, created_at:'', updated_at:'' },
]

function useSort<T>(data: T[], defaultKey: keyof T) {
  const [key, setKey] = useState<keyof T>(defaultKey)
  const [dir, setDir] = useState<'asc'|'desc'>('asc')
  const toggle = (k: keyof T) => { if (k===key) setDir(d=>d==='asc'?'desc':'asc'); else {setKey(k);setDir('asc')} }
  const sorted = [...data].sort((a,b)=>{
    const av=String(a[key]??'').toLowerCase(), bv=String(b[key]??'').toLowerCase()
    return av<bv?(dir==='asc'?-1:1):av>bv?(dir==='asc'?1:-1):0
  })
  return {sorted,key,dir,toggle}
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const [tab, setTab] = useState<'overview'|'guests'|'scanner'>('overview')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<string|null>(null)
  const [guests, setGuests] = useState<Guest[]>(MOCK_GUESTS)
  const [scanResult, setScanResult] = useState<{type:string,guest?:Guest}|null>(null)
  const [scanToken, setScanToken] = useState('')
  const [scanning, setScanning] = useState(false)

  const event = MOCK_EVENTS.find(e => e.id === eventId)
  if (!event) return <div style={{padding:40,textAlign:'center',color:T.n400,fontFamily:'sans-serif'}}>Event not found.</div>

  const eg = guests.filter(g => g.event_id === eventId)
  const counts = { total:eg.length, registered:eg.filter(g=>g.status==='registered').length, checkedIn:eg.filter(g=>g.status==='checked-in').length, invited:eg.filter(g=>g.status==='invited').length }
  const regPct = counts.total ? Math.round(((counts.registered+counts.checkedIn)/counts.total)*100) : 0

  const filtered = eg.filter(g => {
    const q = search.toLowerCase()
    return (!q || `${g.first_name} ${g.last_name} ${g.email??''}`.toLowerCase().includes(q)) && (statusFilter==='all'||g.status===statusFilter)
  })
  const {sorted, key:sk, dir:sd, toggle} = useSort(filtered, 'last_name')

  const checkIn = (guestId: string) => setGuests(p => p.map(g => g.id===guestId ? {...g,status:'checked-in',checked_in_at:new Date().toISOString()} : g))

  const checkQR = (qr: string) => {
    const g = eg.find(x => x.qr_token===qr)
    if (!g) return setScanResult({type:'invalid'})
    if (g.status==='checked-in') return setScanResult({type:'already',guest:g})
    checkIn(g.id)
    setScanResult({type:'success',guest:{...g,checked_in_at:new Date().toISOString()}})
  }
  const simulateScan = () => {
    setScanning(true)
    setTimeout(()=>{
      const el = eg.filter(g=>g.status==='registered')
      if (el.length) checkQR(el[Math.floor(Math.random()*el.length)].qr_token)
      else setScanResult({type:'invalid'})
      setScanning(false)
    },1000)
  }

  const STATS = [{key:'all',label:'TOTAL',val:counts.total,color:T.n800,hover:T.n100},{key:'registered',label:'REG.',val:counts.registered,color:T.green,hover:T.greenBg},{key:'checked-in',label:'IN',val:counts.checkedIn,color:T.gold,hover:T.goldBg},{key:'invited',label:'WAITING',val:counts.invited,color:T.n400,hover:T.n100}]
  const SortCol = ({k,label}:{k:keyof Guest,label:string}) => (
    <div onClick={()=>toggle(k)} style={{cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',gap:3}}>
      <span style={{fontSize:8,letterSpacing:'0.15em',color:T.n400,fontFamily:'sans-serif',fontWeight:700}}>{label}</span>
      <span style={{fontSize:8,color:sk===k?T.gold:T.n300}}>{sk===k?(sd==='asc'?'▲':'▼'):'↕'}</span>
    </div>
  )

  return (
    <div style={{fontFamily:"'Georgia',serif",background:T.n100,minHeight:'100vh'}}>
      <TopBar section="ADMIN DASHBOARD" onBack={()=>router.push('/admin')}/>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 16px'}}>
        <button onClick={()=>router.push('/admin')} style={{background:'none',border:'none',color:T.gold,cursor:'pointer',fontSize:10,letterSpacing:'0.15em',fontFamily:'sans-serif',padding:0,marginBottom:14}}>← ALL EVENTS</button>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:10,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:3}}>{event.subtitle||'XINAO EVENT'}</div>
            <div style={{fontSize:24,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,lineHeight:1.2}}>{event.name}</div>
            <div style={{fontSize:11,color:T.n400,fontFamily:'sans-serif',marginTop:3}}>{event.date} · {event.time} · {event.location}</div>
          </div>
          <button onClick={()=>router.push('/admin')} style={{padding:'8px 14px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.15em',fontFamily:'sans-serif',color:T.n600}}>✎ EDIT</button>
        </div>

        {/* Tabs */}
        <div className="tabs-scroll" style={{display:'flex',borderBottom:`1px solid ${T.n200}`,marginBottom:20}}>
          {(['overview','guests','scanner'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',background:'none',border:'none',borderBottom:`2px solid ${tab===t?T.n800:'transparent'}`,cursor:'pointer',fontSize:9,letterSpacing:'0.15em',fontFamily:'sans-serif',color:tab===t?T.n800:T.n400,fontWeight:tab===t?700:400,marginBottom:-1,whiteSpace:'nowrap'}}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==='overview'&&(
          <div>
            <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'12px 16px',marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontSize:9,color:T.n600,fontFamily:'sans-serif',letterSpacing:'0.1em'}}>REGISTRATION PROGRESS</span><span style={{fontSize:9,color:T.gold,fontFamily:'sans-serif',fontWeight:700}}>{regPct}%</span></div>
              <div style={{height:3,background:T.n100,borderRadius:2}}><div style={{width:`${regPct}%`,height:'100%',background:`linear-gradient(90deg,${T.gold},${T.goldLight})`,borderRadius:2,transition:'width 0.8s ease'}}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:24}}>
              {STATS.map(s=>(
                <div key={s.key} onClick={()=>{setStatusFilter(s.key);setTab('guests')}}
                  style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'14px 10px',cursor:'pointer',userSelect:'none',textAlign:'center',transition:'background 0.1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background=s.hover}
                  onMouseLeave={e=>e.currentTarget.style.background=T.white}>
                  <div style={{fontSize:7,letterSpacing:'0.15em',color:T.n400,fontFamily:'sans-serif',marginBottom:6}}>{s.label}</div>
                  <div style={{fontSize:28,fontFamily:"'Georgia',serif",fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:7,color:T.gold,fontFamily:'sans-serif',marginTop:6}}>LIST →</div>
                </div>
              ))}
            </div>
            {event.cover_image_url&&<div style={{marginBottom:20}}><div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:8}}>INVITATION TEMPLATE</div><img src={event.cover_image_url} alt="template" style={{width:'100%',maxHeight:180,objectFit:'cover',borderRadius:4,border:`1px solid ${T.n200}`}}/></div>}
            <div style={{fontSize:9,letterSpacing:'0.22em',color:T.n400,fontFamily:'sans-serif',marginBottom:10}}>RECENT REGISTRATIONS</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {eg.filter(g=>g.registered_at).sort((a,b)=>new Date(b.registered_at!).getTime()-new Date(a.registered_at!).getTime()).slice(0,5).map(g=>(
                <div key={g.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'10px 14px',gap:10,flexWrap:'wrap'}}>
                  <div><div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800}}>{g.first_name} {g.last_name}</div><div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif'}}>{g.email}</div></div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}><span style={{fontSize:10,color:T.n400,fontFamily:'sans-serif'}}>{fmtDate(g.registered_at)}</span><Badge status={g.status}/></div>
                </div>
              ))}
              {eg.filter(g=>g.registered_at).length===0&&<div style={{padding:'22px',textAlign:'center',color:T.n400,fontSize:12,fontFamily:'sans-serif',background:T.white,border:`1px solid ${T.n200}`,borderRadius:4}}>No registrations yet.</div>}
            </div>
          </div>
        )}

        {/* GUESTS */}
        {tab==='guests'&&(
          <div>
            <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
              <input placeholder="Search by name, email…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:180,padding:'10px 12px',background:T.white,border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none'}}/>
              {['all','invited','registered','checked-in'].map(s=>(
                <button key={s} onClick={()=>setStatusFilter(s)} style={{padding:'8px 12px',background:statusFilter===s?T.n800:T.white,color:statusFilter===s?T.white:T.n600,border:`1px solid ${statusFilter===s?T.n800:T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.08em',fontFamily:'sans-serif',fontWeight:statusFilter===s?700:400,whiteSpace:'nowrap'}}>
                  {s==='checked-in'?'✓ IN':s==='all'?'ALL':s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
            <div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif',marginBottom:10}}>{sorted.length} guest{sorted.length!==1?'s':''}</div>
            <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 120px 110px 44px',padding:'9px 14px',borderBottom:`1px solid ${T.n100}`,background:T.n100,gap:10,alignItems:'center'}}>
                <SortCol k="last_name" label="LAST NAME"/>
                <SortCol k="first_name" label="FIRST NAME"/>
                <SortCol k="status" label="STATUS"/>
                <SortCol k="registered_at" label="REGISTERED"/>
                <div/>
              </div>
              {sorted.length===0&&<div style={{padding:'28px',textAlign:'center',color:T.n400,fontSize:12,fontFamily:'sans-serif'}}>No guests match your filters.</div>}
              {sorted.map(g=>(
                <div key={g.id}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 120px 110px 44px',padding:'11px 14px',alignItems:'center',borderBottom:`1px solid ${T.n100}`,gap:10,background:preview===g.id?'#F9F7F2':'transparent'}}>
                    <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.last_name}</div>
                    <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.first_name}</div>
                    <div style={{display:'flex',alignItems:'center'}}><Badge status={g.status}/></div>
                    <div style={{fontSize:11,color:T.n400,fontFamily:'sans-serif',whiteSpace:'nowrap'}}>{fmtDate(g.registered_at)}</div>
                    <button onClick={()=>setPreview(preview===g.id?null:g.id)} style={{width:36,height:32,background:preview===g.id?T.n800:T.white,border:`1px solid ${preview===g.id?T.n800:T.n200}`,borderRadius:3,cursor:'pointer',fontSize:13,color:preview===g.id?T.gold:T.n600,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {preview===g.id?'▲':'▼'}
                    </button>
                  </div>
                  {preview===g.id&&(
                    <div style={{padding:'18px 16px',background:'#F9F7F2',borderBottom:`1px solid ${T.n100}`}}>
                      <div style={{fontSize:8,letterSpacing:'0.25em',color:T.n400,fontFamily:'sans-serif',marginBottom:14}}>INVITATION — {g.first_name.toUpperCase()} {g.last_name.toUpperCase()}</div>
                      <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'flex-start'}}>
                        <InvitationCard guest={g} event={event} showDownload />
                        <div style={{display:'flex',flexDirection:'column',gap:11,minWidth:170}}>
                          {[['EMAIL',g.email??'—'],['PHONE',g.phone??'—'],['GUEST TOKEN',g.guest_token],['QR TOKEN',g.qr_token]].map(([l,v])=>(
                            <div key={l}><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:3}}>{l}</div><div style={{fontSize:11,fontFamily:'monospace',color:T.n800,background:T.n100,padding:'3px 7px',borderRadius:2,wordBreak:'break-all'}}>{v}</div></div>
                          ))}
                          <div><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>STATUS</div><Badge status={g.status}/></div>
                          {g.registered_at&&<div><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:3}}>REGISTERED</div><div style={{fontSize:11,color:T.n800,fontFamily:'sans-serif'}}>{fmtDate(g.registered_at)} {fmtTime(g.registered_at)}</div></div>}
                          {g.checked_in_at&&<div><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:3}}>CHECKED IN</div><div style={{fontSize:11,color:T.gold,fontWeight:700,fontFamily:'sans-serif'}}>{fmtDate(g.checked_in_at)} {fmtTime(g.checked_in_at)}</div></div>}
                          {g.status==='registered'&&<button onClick={()=>{checkIn(g.id);setPreview(null)}} style={{padding:'8px 14px',background:T.n800,color:T.gold,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.15em',fontFamily:'sans-serif'}}>MANUAL CHECK-IN</button>}
                          <div style={{fontSize:9,color:T.n400,fontFamily:'sans-serif',marginTop:4}}>
                            Invite link: <code style={{fontSize:9,color:T.gold}}>/invite/{eventId}/{g.guest_token}</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCANNER */}
        {tab==='scanner'&&(
          <div style={{maxWidth:320,margin:'0 auto',paddingTop:20}}>
            <div style={{background:T.black,borderRadius:4,padding:'24px 20px'}}>
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{fontSize:9,color:T.gold,letterSpacing:'0.3em',fontFamily:'sans-serif',marginBottom:4}}>XINAO EVENT STAFF</div>
                <div style={{fontSize:16,color:'#FAFAF8',fontFamily:"'Georgia',serif",fontWeight:700}}>QR SCANNER</div>
              </div>
              <div style={{width:'100%',aspectRatio:'1',background:'#111',border:`1px solid ${scanning?T.gold:'#1A1A1A'}`,borderRadius:4,marginBottom:12,position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {[[0,0],[0,1],[1,0],[1,1]].map(([tr,tc],i)=>(
                  <div key={i} style={{position:'absolute',top:tr?'auto':'12px',bottom:tr?'12px':'auto',left:tc?'auto':'12px',right:tc?'12px':'auto',width:18,height:18,borderTop:tr?'none':`2px solid ${T.gold}`,borderBottom:tr?`2px solid ${T.gold}`:'none',borderLeft:tc?'none':`2px solid ${T.gold}`,borderRight:tc?`2px solid ${T.gold}`:'none'}}/>
                ))}
                {scanning?<div style={{textAlign:'center'}}><div style={{fontSize:26,color:T.gold,animation:'spin 1s linear infinite'}}>◎</div></div>
                :<div style={{textAlign:'center'}}><div style={{fontSize:32,color:'#1A1A1A'}}>⊟</div><div style={{fontSize:9,color:'#5C5650',marginTop:5,letterSpacing:'0.1em',fontFamily:'sans-serif'}}>CAMERA HERE</div></div>}
              </div>
              <button onClick={simulateScan} disabled={scanning} style={{width:'100%',padding:'12px 0',background:scanning?T.n800:T.gold,color:T.black,border:'none',borderRadius:2,cursor:scanning?'not-allowed':'pointer',fontSize:11,fontWeight:700,letterSpacing:'0.18em',fontFamily:'sans-serif',marginBottom:10}}>
                {scanning?'SCANNING…':'SIMULATE SCAN'}
              </button>
              <div style={{display:'flex',gap:7,marginBottom:16}}>
                <input value={scanToken} onChange={e=>setScanToken(e.target.value)} placeholder="Enter QR token" onKeyDown={e=>e.key==='Enter'&&checkQR(scanToken.trim())}
                  style={{flex:1,padding:'10px 11px',background:'#111',border:'1px solid #2A2520',borderRadius:2,color:'#FAFAF8',fontSize:12,fontFamily:'sans-serif',outline:'none',minWidth:0}}/>
                <button onClick={()=>checkQR(scanToken.trim())} style={{padding:'10px 12px',background:'#1A1A1A',border:'1px solid #2A2520',borderRadius:2,color:T.n400,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',flexShrink:0}}>CHECK</button>
              </div>
              {scanResult&&(()=>{
                const RES:{[k:string]:{bg:string,border:string,color:string,icon:string,label:string}} = {success:{bg:'#061606',border:'#2D6B2D',color:'#7EC87E',icon:'✓',label:'ACCESS GRANTED'},already:{bg:'#160606',border:T.red,color:'#E57E7E',icon:'⚠',label:'ALREADY CHECKED IN'},invalid:{bg:'#160606',border:T.red,color:'#E57E7E',icon:'✕',label:'INVALID INVITATION'}}
                const R = RES[scanResult.type]
                return(
                  <div style={{padding:18,background:R.bg,border:`1px solid ${R.border}`,borderRadius:4,textAlign:'center'}}>
                    <div style={{fontSize:32,color:R.color,marginBottom:6}}>{R.icon}</div>
                    <div style={{fontSize:11,color:R.color,letterSpacing:'0.18em',fontFamily:'sans-serif',fontWeight:700}}>{R.label}</div>
                    {scanResult.guest&&<div style={{fontSize:16,color:'#FAFAF8',fontFamily:"'Georgia',serif",marginTop:5}}>{scanResult.guest.first_name} {scanResult.guest.last_name}</div>}
                    <button onClick={()=>{setScanResult(null);setScanToken('')}} style={{marginTop:10,padding:'7px 16px',background:'transparent',border:'1px solid #2A2520',color:T.n400,cursor:'pointer',borderRadius:2,fontSize:9,letterSpacing:'0.18em',fontFamily:'sans-serif'}}>SCAN NEXT</button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
