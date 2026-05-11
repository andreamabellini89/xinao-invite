'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { Badge } from '@/components/Badge'
import { InvitationCard } from '@/components/InvitationCard'
import { QRScanner } from '@/components/QRScanner'
import { THEME as T, fmtDate, fmtTime } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import type { XinaoEvent, Guest } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? ''

// ── Sort hook ─────────────────────────────────────────────────────────────────
function useSort<T extends Record<string,any>>(data: T[], defaultKey: keyof T) {
  const [key, setKey] = useState<keyof T>(defaultKey)
  const [dir, setDir] = useState<'asc'|'desc'>('asc')
  const toggle = (k: keyof T) => { if(k===key) setDir(d=>d==='asc'?'desc':'asc'); else{setKey(k);setDir('asc')} }
  const sorted = [...data].sort((a,b)=>{
    const av=String(a[key]??'').toLowerCase(), bv=String(b[key]??'').toLowerCase()
    return av<bv?(dir==='asc'?-1:1):av>bv?(dir==='asc'?1:-1):0
  })
  return { sorted, key, dir, toggle }
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel, danger=false }: {
  title:string; message:string; onConfirm:()=>void; onCancel:()=>void; danger?:boolean
}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.white,borderRadius:4,padding:28,maxWidth:400,width:'100%',border:`1px solid ${T.n200}`}}>
        <div style={{fontSize:17,fontFamily:"'Georgia',serif",color:T.n800,marginBottom:10}}>{title}</div>
        <div style={{fontSize:13,fontFamily:'sans-serif',color:T.n600,lineHeight:1.7,marginBottom:24}}>{message}</div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'9px 18px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,letterSpacing:'0.1em',fontFamily:'sans-serif',color:T.n600}}>CANCEL</button>
          <button onClick={onConfirm} style={{padding:'9px 18px',background:danger?T.red:T.n800,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,letterSpacing:'0.1em',fontFamily:'sans-serif',color:T.white,fontWeight:700}}>{danger?'DELETE':'CONFIRM'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Guest Modal ──────────────────────────────────────────────────────────
function EditGuestModal({ guest, onSave, onClose }: {
  guest: Guest; onSave: (data: Partial<Guest>) => Promise<void>; onClose: () => void
}) {
  const [form, setForm] = useState({
    first_name: guest.first_name,
    last_name:  guest.last_name,
    email:      guest.email ?? '',
    phone:      guest.phone ?? '',
  })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await onSave({ ...form, email: form.email||null, phone: form.phone||null })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.white,borderRadius:4,padding:28,maxWidth:440,width:'100%',border:`1px solid ${T.n200}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <div style={{fontSize:17,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:700}}>Edit Guest</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:T.n400}}>✕</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {([['First Name','first_name'],['Last Name','last_name']] as [string,keyof typeof form][]).map(([label,field])=>(
              <div key={field}>
                <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{label.toUpperCase()} *</label>
                <input value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                  style={{width:'100%',padding:'9px 11px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
          </div>
          {([['Email','email','email'],['Phone','phone','tel']] as [string,keyof typeof form,string][]).map(([label,field,type])=>(
            <div key={field}>
              <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{label.toUpperCase()}</label>
              <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                style={{width:'100%',padding:'9px 11px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10,marginTop:22,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'9px 18px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',color:T.n600}}>CANCEL</button>
          <button onClick={save} disabled={saving||!form.first_name||!form.last_name}
            style={{padding:'9px 18px',background:T.n800,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,letterSpacing:'0.12em',fontFamily:'sans-serif',fontWeight:700}}>
            {saving?'SAVING…':'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EventDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const eventId = params.eventId as string

  const [event,   setEvent]   = useState<XinaoEvent|null>(null)
  const [guests,  setGuests]  = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string|null>(null)
  const [tab,     setTab]     = useState<'overview'|'guests'|'scanner'>('overview')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,  setSearch]  = useState('')
  const [preview, setPreview] = useState<string|null>(null)

  // Selection
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<{done:number,total:number,errors:string[]}|null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ids:string[],count:number}|null>(null)
  const [editGuest,   setEditGuest]   = useState<Guest|null>(null)

  // Scanner
  const [cameraActive,  setCameraActive]  = useState(false)
  const [manualCode,    setManualCode]    = useState('')
  const [scanResult,    setScanResult]    = useState<{type:string,guest?:Guest,code?:string}|null>(null)

  // ── Load ──
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [{ data:evt, error:e1 }, { data:gsts, error:e2 }] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('guests').select('*').eq('event_id', eventId).order('last_name'),
      ])
      if (e1) throw e1; if (e2) throw e2
      setEvent(evt); setGuests(gsts ?? [])
    } catch (e:any) { setError(e.message) }
    setLoading(false)
  }, [eventId])

  useEffect(() => { load() }, [load])

  // ── Check-in by guest id ──
  const checkIn = async (guestId: string) => {
    const now = new Date().toISOString()
    setGuests(p => p.map(g => g.id===guestId ? {...g,status:'checked-in' as const,checked_in_at:now} : g))
    await supabase.from('guests').update({status:'checked-in',checked_in_at:now,updated_at:now}).eq('id',guestId)
  }

  // ── Scanner: handle scanned QR value ──
  // The QR encodes: https://site/checkin/eventId/qrToken
  // OR just the qrToken directly (for manual entry)
  const handleScan = useCallback(async (raw: string) => {
    if (!event) return
    // Extract qr_token — works whether full URL or just token
    let qrToken = raw.trim()
    const match = raw.match(/\/checkin\/[^/]+\/([^/?\s]+)/)
    if (match) qrToken = match[1]

    // Find guest by qr_token
    const g = guests.find(x => x.qr_token === qrToken)
    if (!g) {
      // Try short code (first 8 chars of qr_token)
      const byShort = guests.find(x => x.qr_token.startsWith(qrToken.toLowerCase()) || x.qr_token.slice(0,8).toUpperCase()===qrToken.toUpperCase())
      if (!byShort) { setScanResult({type:'invalid'}); return }
      if (byShort.status==='checked-in') { setScanResult({type:'already',guest:byShort}); return }
      await checkIn(byShort.id)
      setScanResult({type:'success',guest:{...byShort,status:'checked-in' as const,checked_in_at:new Date().toISOString()}})
      return
    }
    if (g.status==='checked-in') { setScanResult({type:'already',guest:g}); return }
    await checkIn(g.id)
    setScanResult({type:'success',guest:{...g,status:'checked-in' as const,checked_in_at:new Date().toISOString()}})
  }, [guests, event])

  // ── Edit guest ──
  const saveGuestEdit = async (data: Partial<Guest>) => {
    if (!editGuest) return
    const { error } = await supabase.from('guests').update({...data,updated_at:new Date().toISOString()}).eq('id',editGuest.id)
    if (error) { setError(error.message); return }
    setGuests(p => p.map(g => g.id===editGuest.id ? {...g,...data} : g))
  }

  // ── Delete guests ──
  const deleteGuests = async (ids: string[]) => {
    const { error } = await supabase.from('guests').delete().in('id',ids)
    if (error) { setError(error.message); return }
    setGuests(p => p.filter(g => !ids.includes(g.id)))
    setSelected(new Set()); setDeleteConfirm(null)
  }

  // ── Send email ──
  const sendEmail = async (g: Guest, evt: XinaoEvent): Promise<boolean> => {
    try {
      const res = await fetch('/api/send-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guest:g,event:evt})})
      return res.ok
    } catch { return false }
  }

  // ── Bulk send ──
  const bulkSend = async () => {
    if (!event || selected.size===0) return
    const toSend = guests.filter(g => selected.has(g.id) && g.email)
    if (!toSend.length) { setError('No selected guests have an email address.'); return }
    setBulkSending(true); setSendProgress({done:0,total:toSend.length,errors:[]})
    const errors: string[] = []
    for (let i=0; i<toSend.length; i++) {
      const ok = await sendEmail(toSend[i], event)
      if (!ok) errors.push(`${toSend[i].first_name} ${toSend[i].last_name}`)
      setSendProgress({done:i+1,total:toSend.length,errors})
      if (i<toSend.length-1) await new Promise(r=>setTimeout(r,300))
    }
    setBulkSending(false)
    setTimeout(()=>{setSendProgress(null);setSelected(new Set())},4000)
  }

  // ── Selection ──
  const toggleOne = (id:string) => setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll = (list:Guest[]) => { if(list.every(g=>selected.has(g.id))) setSelected(new Set()); else setSelected(new Set(list.map(g=>g.id))) }

// ── Derived ──
  const total = guests.length
  const counts = {
    registered: guests.filter(g=>g.status==='registered').length,
    checkedIn:  guests.filter(g=>g.status==='checked-in').length,
    invited:    guests.filter(g=>g.status==='invited').length,
  }
  const regPct = total ? Math.round(((counts.registered+counts.checkedIn)/total)*100) : 0

  const filtered = guests.filter(g=>{
    const q=search.toLowerCase()
    return(!q||`${g.first_name} ${g.last_name} ${g.email??''}`.toLowerCase().includes(q))&&(statusFilter==='all'||g.status===statusFilter)
  })
  const {sorted,key:sk,dir:sd,toggle} = useSort(filtered,'last_name')
  const allChecked = sorted.length>0 && sorted.every(g=>selected.has(g.id))
  const someChecked = sorted.some(g=>selected.has(g.id))

  const SortCol = ({k,label}:{k:keyof Guest;label:string}) => (
    <div onClick={()=>toggle(k)} style={{cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',gap:3,minWidth:0}}>
      <span style={{fontSize:8,letterSpacing:'0.12em',color:T.n400,fontFamily:'sans-serif',fontWeight:700,whiteSpace:'nowrap'}}>{label}</span>
      <span style={{fontSize:8,color:sk===k?T.gold:T.n300,flexShrink:0}}>{sk===k?(sd==='asc'?'▲':'▼'):'↕'}</span>
    </div>
  )

  const STATS = [
    {key:'all',       label:'TOTAL',  val:total,             color:T.n800, hover:T.n100  },
    {key:'registered',label:'REG.',   val:counts.registered, color:T.green,hover:T.greenBg},
    {key:'checked-in',label:'IN',     val:counts.checkedIn,  color:T.gold, hover:T.goldBg},
    {key:'invited',   label:'WAITING',val:counts.invited,    color:T.n400, hover:T.n100  },
  ]

  const RES = {
    success:{bg:'#061606',border:'#2D6B2D',color:'#7EC87E',icon:'✓',label:'ACCESS GRANTED'},
    already:{bg:'#160606',border:T.red,    color:'#E57E7E',icon:'⚠',label:'ALREADY CHECKED IN'},
    invalid:{bg:'#160606',border:T.red,    color:'#E57E7E',icon:'✕',label:'INVALID QR CODE'},
  }

  if (loading) return <div style={{minHeight:'100vh',background:T.n100,display:'flex',alignItems:'center',justifyContent:'center',color:T.n400,fontFamily:'sans-serif'}}>Loading event…</div>
  if (error||!event) return <div style={{minHeight:'100vh',background:T.n100,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12}}><div style={{color:T.red,fontFamily:'sans-serif',fontSize:13}}>{error??'Event not found'}</div><a href="/admin" style={{color:T.gold,fontFamily:'sans-serif',fontSize:11,textDecoration:'none'}}>← BACK TO ADMIN</a></div>

  return (
    <div style={{fontFamily:"'Georgia',serif",background:T.n100,minHeight:'100vh'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes scanline{0%{top:20%}50%{top:80%}100%{top:20%}}`}</style>
      <TopBar section="ADMIN DASHBOARD" onBack={()=>router.push('/admin')}/>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'20px 16px'}}>

        <button onClick={()=>router.push('/admin')} style={{background:'none',border:'none',color:T.gold,cursor:'pointer',fontSize:10,letterSpacing:'0.15em',fontFamily:'sans-serif',padding:0,marginBottom:12}}>← ALL EVENTS</button>

        {/* Event header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:10,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:2}}>{event.subtitle||'XINAO EVENT'}</div>
            <div style={{fontSize:22,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,lineHeight:1.2}}>{event.name}</div>
            <div style={{fontSize:11,color:T.n400,fontFamily:'sans-serif',marginTop:2}}>{event.date} · {event.time} · {event.location}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:`1px solid ${T.n200}`,marginBottom:18,overflowX:'auto'}}>
          {(['overview','guests','scanner'] as const).map(t=>(
            <button key={t} onClick={()=>{setTab(t);if(t!=='scanner') setCameraActive(false)}}
              style={{padding:'8px 16px',background:'none',border:'none',borderBottom:`2px solid ${tab===t?T.n800:'transparent'}`,cursor:'pointer',fontSize:9,letterSpacing:'0.15em',fontFamily:'sans-serif',color:tab===t?T.n800:T.n400,fontWeight:tab===t?700:400,marginBottom:-1,whiteSpace:'nowrap'}}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==='overview'&&(
          <div>
            <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'12px 16px',marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontSize:9,color:T.n600,fontFamily:'sans-serif',letterSpacing:'0.1em'}}>REGISTRATION PROGRESS</span>
                <span style={{fontSize:9,color:T.gold,fontFamily:'sans-serif',fontWeight:700}}>{regPct}%</span>
              </div>
              <div style={{height:3,background:T.n100,borderRadius:2}}>
                <div style={{width:`${regPct}%`,height:'100%',background:`linear-gradient(90deg,${T.gold},${T.goldLight})`,borderRadius:2,transition:'width 0.8s'}}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20}}>
              {STATS.map(s=>(
                <div key={s.key} onClick={()=>{setStatusFilter(s.key);setTab('guests')}}
                  style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'12px 8px',cursor:'pointer',userSelect:'none',textAlign:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background=s.hover}
                  onMouseLeave={e=>e.currentTarget.style.background=T.white}>
                  <div style={{fontSize:7,letterSpacing:'0.15em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{s.label}</div>
                  <div style={{fontSize:26,fontFamily:"'Georgia',serif",fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:7,color:T.gold,fontFamily:'sans-serif',marginTop:5}}>LIST →</div>
                </div>
              ))}
            </div>
            {event.cover_image_url&&<div style={{marginBottom:16}}><div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:6}}>INVITATION TEMPLATE</div><img src={event.cover_image_url} alt="template" style={{width:'100%',maxHeight:160,objectFit:'cover',borderRadius:4,border:`1px solid ${T.n200}`}}/></div>}
            <div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:8}}>RECENT REGISTRATIONS</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {guests.filter(g=>g.registered_at).sort((a,b)=>new Date(b.registered_at!).getTime()-new Date(a.registered_at!).getTime()).slice(0,5).map(g=>(
                <div key={g.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'10px 14px',gap:8,flexWrap:'wrap'}}>
                  <div><div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800}}>{g.first_name} {g.last_name}</div><div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif'}}>{g.email}</div></div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:10,color:T.n400,fontFamily:'sans-serif'}}>{fmtDate(g.registered_at)}</span><Badge status={g.status}/></div>
                </div>
              ))}
              {!guests.filter(g=>g.registered_at).length&&<div style={{padding:'20px',textAlign:'center',color:T.n400,fontSize:12,fontFamily:'sans-serif',background:T.white,border:`1px solid ${T.n200}`,borderRadius:4}}>No registrations yet.</div>}
            </div>
          </div>
        )}

        {/* ── GUESTS ── */}
        {tab==='guests'&&(
          <div>
            {/* Search + filters */}
            <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
              <input placeholder="Search by name, email…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{flex:1,minWidth:160,padding:'10px 12px',background:T.white,border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none'}}/>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {['all','invited','registered','checked-in'].map(s=>(
                  <button key={s} onClick={()=>setStatusFilter(s)}
                    style={{padding:'8px 10px',background:statusFilter===s?T.n800:T.white,color:statusFilter===s?T.white:T.n600,border:`1px solid ${statusFilter===s?T.n800:T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.06em',fontFamily:'sans-serif',fontWeight:statusFilter===s?700:400,whiteSpace:'nowrap'}}>
                    {s==='checked-in'?'✓ IN':s==='all'?'ALL':s.charAt(0).toUpperCase()+s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk action bar */}
            {someChecked&&(
              <div style={{background:T.n800,borderRadius:4,padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:T.white,fontFamily:'sans-serif',fontWeight:700}}>{selected.size} selected</span>
                <div style={{display:'flex',gap:8,marginLeft:'auto',flexWrap:'wrap'}}>
                  <button onClick={bulkSend} disabled={bulkSending}
                    style={{padding:'7px 14px',background:T.gold,color:T.black,border:'none',borderRadius:2,cursor:bulkSending?'not-allowed':'pointer',fontSize:10,letterSpacing:'0.12em',fontFamily:'sans-serif',fontWeight:700}}>
                    {bulkSending?`✉ ${sendProgress?.done}/${sendProgress?.total}…`:`✉ SEND INVITATIONS (${selected.size})`}
                  </button>
                  <button onClick={()=>setDeleteConfirm({ids:Array.from(selected),count:selected.size})}
                    style={{padding:'7px 14px',background:T.red,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:10,letterSpacing:'0.12em',fontFamily:'sans-serif',fontWeight:700}}>
                    ✕ DELETE ({selected.size})
                  </button>
                  <button onClick={()=>setSelected(new Set())} style={{padding:'7px 10px',background:'none',border:'1px solid #3A3520',color:T.n400,borderRadius:2,cursor:'pointer',fontSize:10,fontFamily:'sans-serif'}}>Cancel</button>
                </div>
              </div>
            )}

            {sendProgress&&!bulkSending&&(
              <div style={{marginBottom:10,padding:'9px 13px',background:sendProgress.errors.length===0?T.greenBg:T.goldBg,border:`1px solid ${sendProgress.errors.length===0?T.greenBorder:T.goldBorder}`,borderRadius:3,fontSize:12,color:sendProgress.errors.length===0?T.green:T.gold,fontFamily:'sans-serif'}}>
                {sendProgress.errors.length===0?`✓ ${sendProgress.total} invitation${sendProgress.total!==1?'s':''} sent.`:`✓ ${sendProgress.done-sendProgress.errors.length} sent. Failed: ${sendProgress.errors.join(', ')}`}
              </div>
            )}

            <div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif',marginBottom:8}}>{sorted.length} guest{sorted.length!==1?'s':''}</div>

            {/* ── DESKTOP TABLE ── */}
            <div style={{display:'none'}} className="desktop-table">
              {/* hidden on mobile via CSS — we use inline responsive below */}
            </div>

            {/* Responsive: desktop table / mobile cards */}
            <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,overflow:'hidden'}}>
              {/* Header — hidden on narrow screens via overflow */}
              <div style={{display:'grid',gridTemplateColumns:'32px minmax(0,1fr) minmax(0,1fr) 100px 90px 70px 36px',padding:'8px 12px',borderBottom:`1px solid ${T.n100}`,background:T.n100,gap:6,alignItems:'center'}}>
                <input type="checkbox" checked={allChecked} onChange={()=>toggleAll(sorted)} style={{cursor:'pointer',width:13,height:13}}/>
                <SortCol k="last_name"     label="LAST NAME"/>
                <SortCol k="first_name"    label="FIRST NAME"/>
                <SortCol k="status"        label="STATUS"/>
                <SortCol k="registered_at" label="REG."/>
                <div style={{fontSize:8,letterSpacing:'0.12em',color:T.n400,fontFamily:'sans-serif',fontWeight:700}}>ACTIONS</div>
                <div/>
              </div>

              {sorted.length===0&&<div style={{padding:'24px',textAlign:'center',color:T.n400,fontSize:12,fontFamily:'sans-serif'}}>No guests match your filters.</div>}

              {sorted.map(g=>(
                <div key={g.id}>
                  {/* ── Desktop row ── */}
                  <div style={{display:'grid',gridTemplateColumns:'32px minmax(0,1fr) minmax(0,1fr) 100px 90px 70px 36px',padding:'10px 12px',alignItems:'center',borderBottom:`1px solid ${T.n100}`,gap:6,background:selected.has(g.id)?'#F5F2ED':preview===g.id?'#F9F7F2':'transparent'}}>
                    <input type="checkbox" checked={selected.has(g.id)} onChange={()=>toggleOne(g.id)} style={{cursor:'pointer',width:13,height:13}}/>
                    <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.last_name}</div>
                    <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.first_name}</div>
                    <div style={{display:'flex',alignItems:'center'}}><Badge status={g.status}/></div>
                    <div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif',whiteSpace:'nowrap'}}>{fmtDate(g.registered_at)}</div>
                    <div style={{display:'flex',gap:3}}>
                      <button onClick={()=>setEditGuest(g)} title="Edit" style={{width:28,height:26,background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,color:T.n600,display:'flex',alignItems:'center',justifyContent:'center'}}>✎</button>
                      {g.email&&<button onClick={async()=>{const ok=await sendEmail(g,event!);if(!ok)setError(`Failed to send to ${g.first_name}`)}} title="Send email" style={{width:28,height:26,background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,color:T.gold,display:'flex',alignItems:'center',justifyContent:'center'}}>✉</button>}
                      <button onClick={()=>setDeleteConfirm({ids:[g.id],count:1})} title="Delete" style={{width:28,height:26,background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,color:T.red,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                    </div>
                    <button onClick={()=>setPreview(preview===g.id?null:g.id)} style={{width:34,height:30,background:preview===g.id?T.n800:T.white,border:`1px solid ${preview===g.id?T.n800:T.n200}`,borderRadius:3,cursor:'pointer',fontSize:12,color:preview===g.id?T.gold:T.n600,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {preview===g.id?'▲':'▼'}
                    </button>
                  </div>

                  {/* Expanded */}
                  {preview===g.id&&(
                    <div style={{padding:'16px 14px',background:'#F9F7F2',borderBottom:`1px solid ${T.n100}`}}>
                      <div style={{fontSize:8,letterSpacing:'0.25em',color:T.n400,fontFamily:'sans-serif',marginBottom:12}}>INVITATION — {g.first_name.toUpperCase()} {g.last_name.toUpperCase()}</div>
                      <div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'flex-start'}}>
                        <InvitationCard guest={g} event={event} showDownload/>
                        <div style={{display:'flex',flexDirection:'column',gap:10,minWidth:180,flex:1}}>
                          {[['EMAIL',g.email??'—'],['PHONE',g.phone??'—']].map(([l,v])=>(
                            <div key={l}><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:2}}>{l}</div><div style={{fontSize:12,color:T.n800,fontFamily:'sans-serif'}}>{v}</div></div>
                          ))}
                          {/* Short code */}
                          <div>
                            <div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:4}}>SHORT CHECK-IN CODE</div>
                            <div style={{fontSize:18,fontFamily:'monospace',fontWeight:700,color:T.gold,background:T.goldBg,padding:'6px 12px',borderRadius:3,letterSpacing:'0.15em',display:'inline-block'}}>
                              {g.qr_token.slice(0,8).toUpperCase()}
                            </div>
                          </div>
                          {/* Invite link */}
                          <div>
                            <div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:4}}>INVITATION LINK</div>
                            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                              <code style={{fontSize:10,color:T.gold,background:T.n100,padding:'4px 7px',borderRadius:2,wordBreak:'break-all'}}>{SITE}/invite/{eventId}/{g.guest_token}</code>
                              <button onClick={()=>navigator.clipboard.writeText(`${SITE}/invite/${eventId}/${g.guest_token}`)} style={{padding:'4px 9px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,fontFamily:'sans-serif',color:T.n600,flexShrink:0}}>COPY</button>
                            </div>
                          </div>
                          <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                            <button onClick={()=>setEditGuest(g)} style={{padding:'7px 13px',background:'none',border:`1px solid ${T.n200}`,color:T.n800,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>✎ EDIT</button>
                            {g.status==='registered'&&<button onClick={()=>{checkIn(g.id);setPreview(null)}} style={{padding:'7px 13px',background:T.n800,color:T.gold,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>✓ CHECK IN</button>}
                            {g.status==='invited'&&<button onClick={()=>{checkIn(g.id);setPreview(null)}} style={{padding:'7px 13px',background:T.green,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>✓ FORCE CHECK IN</button>}
                            {g.email&&<button onClick={async()=>{await sendEmail(g,event!)}} style={{padding:'7px 13px',background:'none',border:`1px solid ${T.gold}`,color:T.gold,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>✉ SEND EMAIL</button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── MOBILE CARDS (shown on small screens via max-width) ── */}
            {/* This is a second render only for mobile — we toggle via JS */}
          </div>
        )}

        {/* ── SCANNER ── */}
        {tab==='scanner'&&(
          <div style={{maxWidth:400,margin:'0 auto',paddingTop:12}}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:9,color:T.gold,letterSpacing:'0.3em',fontFamily:'sans-serif',marginBottom:3}}>QR SCANNER</div>
              <div style={{fontSize:16,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800}}>{event.name}</div>
              <div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif',marginTop:2}}>{guests.filter(g=>g.status==='registered').length} guests waiting · {guests.filter(g=>g.status==='checked-in').length} checked in</div>
            </div>

            {/* Real camera scanner */}
            <QRScanner active={cameraActive} onScan={(raw)=>{handleScan(raw);setCameraActive(false)}}/>

            <button onClick={()=>{setScanResult(null);setCameraActive(a=>!a)}}
              style={{width:'100%',padding:'13px 0',background:cameraActive?T.red:T.gold,color:cameraActive?T.white:T.black,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:'0.2em',fontFamily:'sans-serif',marginTop:10,marginBottom:10}}>
              {cameraActive?'⬛ STOP CAMERA':'📷 START CAMERA'}
            </button>

            {/* Manual code entry */}
            <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:16,marginBottom:16}}>
              <div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:10}}>MANUAL CHECK-IN — SHORT CODE OR QR TOKEN</div>
              <div style={{display:'flex',gap:7}}>
                <input value={manualCode} onChange={e=>setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  onKeyDown={e=>{if(e.key==='Enter'){handleScan(manualCode);setManualCode('')}}}
                  style={{flex:1,padding:'11px 12px',background:T.n100,border:`1px solid ${T.n200}`,borderRadius:2,fontSize:14,fontFamily:'monospace',color:T.n800,outline:'none',letterSpacing:'0.1em'}}/>
                <button onClick={()=>{handleScan(manualCode);setManualCode('')}}
                  style={{padding:'11px 16px',background:T.n800,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',fontWeight:700,letterSpacing:'0.1em'}}>
                  CHECK IN
                </button>
              </div>
              <div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif',marginTop:7,lineHeight:1.5}}>
                The short code is the first 8 characters of the guest QR token — visible in the guest detail panel.
              </div>
            </div>

            {/* Scan result */}
            {scanResult&&(()=>{
              const R=RES[scanResult.type as keyof typeof RES]
              return(
                <div style={{padding:20,background:R.bg,border:`1px solid ${R.border}`,borderRadius:4,textAlign:'center'}}>
                  <div style={{fontSize:40,color:R.color,marginBottom:8}}>{R.icon}</div>
                  <div style={{fontSize:12,color:R.color,letterSpacing:'0.2em',fontFamily:'sans-serif',fontWeight:700}}>{R.label}</div>
                  {scanResult.guest&&<div style={{fontSize:20,color:'#FAFAF8',fontFamily:"'Georgia',serif",marginTop:8,fontWeight:700}}>{scanResult.guest.first_name} {scanResult.guest.last_name}</div>}
                  {scanResult.type==='already'&&scanResult.guest?.checked_in_at&&<div style={{fontSize:11,color:T.n400,marginTop:5,fontFamily:'sans-serif'}}>Checked in at {fmtTime(scanResult.guest.checked_in_at)}</div>}
                  {scanResult.type==='invalid'&&<div style={{fontSize:11,color:T.n400,marginTop:5,fontFamily:'sans-serif'}}>QR code not found in guest list.</div>}
                  <button onClick={()=>{setScanResult(null);setManualCode('');setCameraActive(true)}}
                    style={{marginTop:14,padding:'10px 24px',background:T.gold,color:T.black,border:'none',cursor:'pointer',borderRadius:2,fontSize:10,letterSpacing:'0.2em',fontFamily:'sans-serif',fontWeight:700}}>
                    SCAN NEXT →
                  </button>
                </div>
              )
            })()}

            {/* Guest list quick view */}
            <div style={{marginTop:20}}>
              <div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:10}}>GUESTS AT THIS EVENT</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {guests.map(g=>(
                  <div key={g.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'10px 14px',gap:10}}>
                    <div>
                      <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600}}>{g.first_name} {g.last_name}</div>
                      <div style={{fontSize:10,fontFamily:'monospace',color:T.n400,marginTop:1}}>{g.qr_token.slice(0,8).toUpperCase()}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <Badge status={g.status}/>
                      {g.status!=='checked-in'&&(
                        <button onClick={()=>checkIn(g.id)} style={{padding:'5px 10px',background:T.green,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.1em',fontFamily:'sans-serif',fontWeight:700}}>✓ IN</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {deleteConfirm&&<ConfirmModal title="Delete" message={deleteConfirm.count===1?'Delete this guest?':`Delete ${deleteConfirm.count} guests?`} onConfirm={()=>deleteGuests(deleteConfirm.ids)} onCancel={()=>setDeleteConfirm(null)} danger/>}
      {editGuest&&<EditGuestModal guest={editGuest} onSave={saveGuestEdit} onClose={()=>setEditGuest(null)}/>}

      {/* Error toast */}
      {error&&(
        <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:T.red,color:T.white,padding:'10px 20px',borderRadius:4,fontSize:12,fontFamily:'sans-serif',zIndex:500,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',maxWidth:'90vw',textAlign:'center'}}>
          ⚠ {error}
          <button onClick={()=>setError(null)} style={{marginLeft:12,background:'none',border:'none',color:T.white,cursor:'pointer',fontSize:14}}>✕</button>
        </div>
      )}
    </div>
  )
}
