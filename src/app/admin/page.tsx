'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { Modal } from '@/components/Modal'
import { ImageUpload } from '@/components/ImageUpload'
import { THEME as T, uid } from '@/lib/utils'
import type { XinaoEvent, EventFormData } from '@/types'

// ── Mock data (replace with Supabase calls in production) ─────────────────────
const MOCK_EVENTS: XinaoEvent[] = [
  { id:'evt-001', name:'Threads of Connection', subtitle:'35th Anniversary', date:'24 JUNE 2026', time:'8:00 PM', location:'GIARDINO CORSINI', address:'VIA DELLA SCALA 115, FLORENCE, ITALY', description:'Art · Yarn · Nature · Contemporary Culture', status:'upcoming', cover_image_url:null, created_at:'2026-01-01T00:00:00Z', updated_at:'2026-01-01T00:00:00Z' },
  { id:'evt-002', name:'Native Soul Collection', subtitle:'Winter Preview 2026', date:'15 SEPTEMBER 2026', time:'7:30 PM', location:'PALAZZO STROZZI', address:'PIAZZA DEGLI STROZZI, FLORENCE, ITALY', description:'Cashmere · Heritage · Innovation', status:'upcoming', cover_image_url:null, created_at:'2026-01-02T00:00:00Z', updated_at:'2026-01-02T00:00:00Z' },
]
const MOCK_GUESTS = [
  { id:'g001', event_id:'evt-001', first_name:'Marco',     last_name:'Conti',      email:'m.conti@luxfashion.it',    status:'registered'  as const, registered_at:'2026-05-10T14:32:00Z', checked_in_at:null, guest_token:'tok-a1b2', qr_token:'qr-x1y2', phone:null, created_at:'', updated_at:'' },
  { id:'g002', event_id:'evt-001', first_name:'Sophia',    last_name:'Martini',    email:'s.martini@vogue.it',       status:'registered'  as const, registered_at:'2026-05-11T09:15:00Z', checked_in_at:null, guest_token:'tok-d4e5', qr_token:'qr-a4b5', phone:null, created_at:'', updated_at:'' },
  { id:'g003', event_id:'evt-001', first_name:'James',     last_name:'Richardson', email:'j.rich@sothebys.com',      status:'invited'     as const, registered_at:null, checked_in_at:null, guest_token:'tok-g7h8', qr_token:'qr-d7e8', phone:null, created_at:'', updated_at:'' },
  { id:'g004', event_id:'evt-001', first_name:'Elena',     last_name:'Vasquez',    email:'e.vasquez@hermes.fr',      status:'invited'     as const, registered_at:null, checked_in_at:null, guest_token:'tok-j1k2', qr_token:'qr-g1h2', phone:null, created_at:'', updated_at:'' },
  { id:'g005', event_id:'evt-001', first_name:'Luca',      last_name:'Ferragamo',  email:'l.ferragamo@ferragamo.com',status:'checked-in'  as const, registered_at:'2026-05-08T16:00:00Z', checked_in_at:'2026-06-24T20:15:00Z', guest_token:'tok-m4n5', qr_token:'qr-j4k5', phone:null, created_at:'', updated_at:'' },
  { id:'g006', event_id:'evt-001', first_name:'Charlotte', last_name:'Dubois',     email:'c.dubois@lvmh.fr',         status:'registered'  as const, registered_at:'2026-05-12T11:30:00Z', checked_in_at:null, guest_token:'tok-p7q8', qr_token:'qr-m7n8', phone:null, created_at:'', updated_at:'' },
  { id:'g007', event_id:'evt-002', first_name:'Alessandro',last_name:'Ferrari',    email:'a.ferrari@maxmara.com',    status:'registered'  as const, registered_at:'2026-05-15T10:00:00Z', checked_in_at:null, guest_token:'tok-s1t2', qr_token:'qr-p1q2', phone:null, created_at:'', updated_at:'' },
  { id:'g008', event_id:'evt-002', first_name:'Yuki',      last_name:'Tanaka',     email:'y.tanaka@isseymiyake.jp',  status:'invited'     as const, registered_at:null, checked_in_at:null, guest_token:'tok-v4w5', qr_token:'qr-s4t5', phone:null, created_at:'', updated_at:'' },
]

const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'xinao2026'

// ── Event Form Modal ──────────────────────────────────────────────────────────
function EventFormModal({ initial, onSave, onClose }: { initial?: XinaoEvent | null; onSave: (f: EventFormData) => void; onClose: () => void }) {
  const blank: EventFormData = { name:'', subtitle:'', date:'', time:'', location:'', address:'', description:'', status:'upcoming', cover_image_url:null }
  const [form, setForm] = useState<EventFormData>(initial ? { name:initial.name, subtitle:initial.subtitle??'', date:initial.date, time:initial.time, location:initial.location, address:initial.address??'', description:initial.description??'', status:initial.status, cover_image_url:initial.cover_image_url } : blank)
  const set = (k: keyof EventFormData, v: string | null) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.name && form.date && form.location

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <div style={{ background:T.white, borderRadius:4, padding:'28px 24px', maxWidth:520, width:'100%', border:`1px solid ${T.n200}`, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
          <div><div style={{ fontSize:9, letterSpacing:'0.3em', color:T.gold, fontFamily:'sans-serif', marginBottom:3 }}>XINAO EVENTS</div>
          <div style={{ fontSize:18, fontFamily:"'Georgia',serif", color:T.n800, fontWeight:700 }}>{initial ? 'Edit Event' : 'New Event'}</div></div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:T.n400 }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {([['Event Name *','name'],['Subtitle / Edition','subtitle'],['Date *','date','24 JUNE 2026'],['Time *','time','8:00 PM'],['Venue / Location *','location'],['Full Address','address'],['Description / Tagline','description']] as [string,keyof EventFormData,string?][]).map(([label,key,ph]) => (
            <div key={key}>
              <label style={{ display:'block', fontSize:9, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:5 }}>{label.toUpperCase()}</label>
              <input value={form[key] as string ?? ''} placeholder={ph??''} onChange={e=>set(key,e.target.value)} style={{ width:'100%', padding:'10px 13px', border:`1px solid ${T.n200}`, borderRadius:2, fontSize:13, fontFamily:'sans-serif', color:T.n800, outline:'none', background:T.white, boxSizing:'border-box' }}/>
            </div>
          ))}
          <div>
            <label style={{ display:'block', fontSize:9, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:5 }}>STATUS</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)} style={{ width:'100%', padding:'10px 13px', border:`1px solid ${T.n200}`, borderRadius:2, fontSize:13, fontFamily:'sans-serif', color:T.n800, background:T.white }}>
              <option value="upcoming">Upcoming</option><option value="active">Active</option><option value="past">Past</option>
            </select>
          </div>
          <ImageUpload value={form.cover_image_url} onChange={v=>set('cover_image_url',v)} label="Invitation Template (JPG/PNG)"/>
          {form.cover_image_url && <div style={{ fontSize:10, color:T.green, fontFamily:'sans-serif', background:T.greenBg, padding:'7px 10px', borderRadius:3, border:`1px solid ${T.greenBorder}` }}>✓ Template uploaded — will appear on the invitation</div>}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end', flexWrap:'wrap' }}>
          <button onClick={onClose} style={{ padding:'10px 18px', background:'none', border:`1px solid ${T.n200}`, borderRadius:2, cursor:'pointer', fontSize:11, letterSpacing:'0.1em', fontFamily:'sans-serif', color:T.n600 }}>CANCEL</button>
          <button onClick={()=>valid&&onSave(form)} disabled={!valid} style={{ padding:'10px 20px', background:valid?T.n800:T.n300, color:valid?T.white:T.n400, border:'none', borderRadius:2, cursor:valid?'pointer':'not-allowed', fontSize:11, letterSpacing:'0.15em', fontFamily:'sans-serif', fontWeight:700 }}>
            {initial ? 'SAVE CHANGES' : 'CREATE EVENT'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [auth, setAuth] = useState(false)
  const [pwd, setPwd] = useState('')
  const [pwdErr, setPwdErr] = useState(false)
  const [events, setEvents] = useState<XinaoEvent[]>(MOCK_EVENTS)
  const [guests, setGuests] = useState(MOCK_GUESTS)
  const [formOpen, setFormOpen] = useState(false)
  const [editEvt, setEditEvt] = useState<XinaoEvent | null>(null)
  const [delEvt, setDelEvt] = useState<XinaoEvent | null>(null)
  const [sortKey, setSortKey] = useState<'name'|'date'|'status'>('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [menuOpen, setMenuOpen] = useState<string|null>(null)

  const login = () => {
    if (pwd === ADMIN_PWD) { setAuth(true) } else { setPwdErr(true); setTimeout(()=>setPwdErr(false),2000) }
  }

  const toggleSort = (k: typeof sortKey) => {
    if (k === sortKey) setSortDir(d => d==='asc'?'desc':'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  const sorted = [...events].sort((a, b) => {
    const av = (a[sortKey]??'').toLowerCase(), bv = (b[sortKey]??'').toLowerCase()
    return av < bv ? (sortDir==='asc'?-1:1) : av > bv ? (sortDir==='asc'?1:-1) : 0
  })

  const saveEvent = (form: EventFormData) => {
    if (editEvt) setEvents(p => p.map(e => e.id===editEvt.id ? {...editEvt,...form} : e))
    else setEvents(p => [...p, { ...form, id:`evt-${uid()}`, created_at:new Date().toISOString(), updated_at:new Date().toISOString() } as XinaoEvent])
    setFormOpen(false); setEditEvt(null)
  }

  const confirmDel = () => {
    if (!delEvt) return
    setEvents(p => p.filter(e => e.id !== delEvt.id))
    setGuests(p => p.filter(g => g.event_id !== delEvt.id))
    setDelEvt(null)
  }

  if (!auth) return (
    <div style={{ minHeight:'100vh', background:T.black, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:340, textAlign:'center' }}>
        <div style={{ fontSize:26, fontWeight:700, color:T.gold, fontFamily:"'Georgia',serif", letterSpacing:'0.1em', marginBottom:4 }}>XINAO</div>
        <div style={{ width:18, height:1, background:T.gold, margin:'0 auto 7px' }}/>
        <div style={{ fontSize:9, letterSpacing:'0.3em', color:T.n600, fontFamily:'sans-serif', marginBottom:32 }}>ADMIN DASHBOARD</div>
        <div style={{ background:'#111', border:`1px solid ${pwdErr?'#9F0E10':'#1A1A1A'}`, borderRadius:4, padding:28 }}>
          <div style={{ fontSize:9, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:4, textAlign:'left' }}>PASSWORD</div>
          <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr(false)}} onKeyDown={e=>e.key==='Enter'&&login()}
            placeholder="Enter admin password" style={{ width:'100%', padding:'11px 12px', background:'#0A0A0A', border:`1px solid ${pwdErr?'#9F0E10':'#2A2520'}`, borderRadius:2, color:T.white, fontSize:14, fontFamily:'sans-serif', outline:'none', boxSizing:'border-box', marginBottom:7 }}/>
          {pwdErr && <div style={{ fontSize:11, color:'#E57E7E', fontFamily:'sans-serif', marginBottom:7, textAlign:'left' }}>Incorrect password.</div>}
          <button onClick={login} style={{ width:'100%', padding:12, background:T.gold, color:T.black, border:'none', borderRadius:2, cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.18em', fontFamily:'sans-serif', marginTop:4 }}>SIGN IN</button>
          <div style={{ fontSize:10, color:T.n600, fontFamily:'sans-serif', marginTop:14 }}>Demo: <code style={{ color:T.n400 }}>xinao2026</code></div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:T.n100, minHeight:'100vh' }}>
      <TopBar section="ADMIN DASHBOARD" backHref="/" />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, gap:12, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.3em', color:T.gold, fontFamily:'sans-serif', marginBottom:5 }}>ADMIN DASHBOARD</div>
            <div style={{ fontSize:26, fontFamily:"'Georgia',serif", fontWeight:700, color:T.n800 }}>Events</div>
            <div style={{ fontSize:11, color:T.n400, fontFamily:'sans-serif', marginTop:2 }}>{events.length} event{events.length!==1?'s':''}</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            {(['name','date','status'] as const).map(k => (
              <button key={k} onClick={()=>toggleSort(k)} style={{ padding:'6px 10px', background:sortKey===k?T.n800:T.white, color:sortKey===k?T.white:T.n600, border:`1px solid ${sortKey===k?T.n800:T.n200}`, borderRadius:2, cursor:'pointer', fontSize:9, letterSpacing:'0.08em', fontFamily:'sans-serif', display:'flex', alignItems:'center', gap:3 }}>
                {k.toUpperCase()} <span style={{ fontSize:8, color:sortKey===k?T.goldLight:T.n300 }}>{sortKey===k?(sortDir==='asc'?'▲':'▼'):'↕'}</span>
              </button>
            ))}
            <button onClick={()=>{setEditEvt(null);setFormOpen(true)}} style={{ padding:'9px 16px', background:T.n800, color:T.cream, border:'none', borderRadius:2, cursor:'pointer', fontSize:10, letterSpacing:'0.18em', fontFamily:'sans-serif', fontWeight:700 }}>+ NEW EVENT</button>
          </div>
        </div>

        {/* Events grid */}
        {events.length === 0 && <div style={{ textAlign:'center', padding:'48px 20px', color:T.n400, fontFamily:'sans-serif', fontSize:13, border:`1px dashed ${T.n200}`, borderRadius:4 }}>No events yet. Create your first event.</div>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {sorted.map(evt => {
            const eg = guests.filter(g => g.event_id === evt.id)
            const reg = eg.filter(g => g.status !== 'invited').length
            const pct = eg.length ? Math.round(reg/eg.length*100) : 0
            return (
              <div key={evt.id} style={{ background:T.white, border:`1px solid ${T.n200}`, borderRadius:4, overflow:'hidden', position:'relative' }}>
                {evt.cover_image_url && <img src={evt.cover_image_url} alt="" style={{ width:'100%', height:80, objectFit:'cover', display:'block' }}/>}
                <div style={{ height:3, background:`linear-gradient(90deg,${T.gold} ${pct}%,${T.n200} ${pct}%)` }}/>
                <div style={{ padding:'16px 14px', cursor:'pointer' }} onClick={()=>router.push(`/admin/events/${evt.id}`)}>
                  <div style={{ fontSize:8, letterSpacing:'0.25em', color:T.gold, fontFamily:'sans-serif', marginBottom:3 }}>{evt.subtitle||'XINAO EVENT'}</div>
                  <div style={{ fontSize:16, fontFamily:"'Georgia',serif", fontWeight:700, color:T.n800, marginBottom:2 }}>{evt.name}</div>
                  <div style={{ fontSize:10, color:T.n400, fontFamily:'sans-serif', marginBottom:12 }}>{evt.date} · {evt.location}</div>
                  <div style={{ display:'flex', gap:14 }}>
                    {[['INVITED',eg.length],['REG.',reg],['IN',eg.filter(g=>g.status==='checked-in').length]].map(([l,v])=>(
                      <div key={String(l)}><div style={{ fontSize:7, letterSpacing:'0.18em', color:T.n400, fontFamily:'sans-serif' }}>{l}</div><div style={{ fontSize:18, fontFamily:"'Georgia',serif", color:T.n800, fontWeight:700 }}>{v}</div></div>
                    ))}
                  </div>
                </div>
                <div style={{ position:'absolute', top:evt.cover_image_url?88:8, right:8 }}>
                  <button onClick={e=>{e.stopPropagation();setMenuOpen(menuOpen===evt.id?null:evt.id)}} style={{ width:26, height:26, background:T.white, border:`1px solid ${T.n200}`, borderRadius:2, cursor:'pointer', fontSize:13, color:T.n400, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>⋯</button>
                  {menuOpen===evt.id && (
                    <div style={{ position:'absolute', top:29, right:0, background:T.white, border:`1px solid ${T.n200}`, borderRadius:4, boxShadow:'0 4px 20px rgba(0,0,0,0.1)', zIndex:100, minWidth:140, overflow:'hidden' }}>
                      {[
                        {l:'✎  Edit', a:()=>{setMenuOpen(null);setEditEvt(evt);setFormOpen(true);}},
                        {l:'⧉  Duplicate', a:()=>{setMenuOpen(null);setEvents(p=>[...p,{...evt,id:`evt-${uid()}`,name:`${evt.name} (Copy)`,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}]);}},
                        {l:'✕  Delete', a:()=>{setMenuOpen(null);setDelEvt(evt);}, danger:true},
                      ].map(item=>(
                        <button key={item.l} onClick={item.a} style={{ display:'block', width:'100%', padding:'9px 13px', background:'none', border:'none', borderBottom:`1px solid ${T.n100}`, cursor:'pointer', fontSize:11, fontFamily:'sans-serif', color:(item as any).danger?T.red:T.n800, textAlign:'left' }}>{item.l}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {formOpen && <EventFormModal initial={editEvt} onSave={saveEvent} onClose={()=>{setFormOpen(false);setEditEvt(null)}} />}
      {delEvt && <Modal title="Delete Event" message={`Delete "${delEvt.name}"? This removes all ${guests.filter(g=>g.event_id===delEvt.id).length} associated guests and cannot be undone.`} onConfirm={confirmDel} onCancel={()=>setDelEvt(null)} danger />}
      {menuOpen && <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={()=>setMenuOpen(null)}/>}
    </div>
  )
}
