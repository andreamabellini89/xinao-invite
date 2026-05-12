'use client'
import { useState, useEffect, useCallback } from 'react'
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

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const check = () => setM(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return m
}

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

function ConfirmModal({ title, message, onConfirm, onCancel, danger=false }: {
  title:string; message:string; onConfirm:()=>void; onCancel:()=>void; danger?:boolean
}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.white,borderRadius:4,padding:28,maxWidth:400,width:'100%',border:`1px solid ${T.n200}`}}>
        <div style={{fontSize:17,fontFamily:"'Georgia',serif",color:T.n800,marginBottom:10}}>{title}</div>
        <div style={{fontSize:13,fontFamily:'sans-serif',color:T.n600,lineHeight:1.7,marginBottom:24}}>{message}</div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button onClick={onCancel} style={{padding:'9px 18px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',color:T.n600}}>CANCEL</button>
          <button onClick={onConfirm} style={{padding:'9px 18px',background:danger?T.red:T.n800,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',color:T.white,fontWeight:700}}>{danger?'DELETE':'CONFIRM'}</button>
        </div>
      </div>
    </div>
  )
}

function EditGuestModal({ guest, onSave, onClose }: { guest:Guest; onSave:(d:Partial<Guest>)=>Promise<void>; onClose:()=>void }) {
  const [form, setForm] = useState({ first_name:guest.first_name, last_name:guest.last_name, email:guest.email??'', phone:guest.phone??'' })
  const [saving, setSaving] = useState(false)
  const save = async () => { setSaving(true); await onSave({...form, email:form.email||null, phone:form.phone||null}); setSaving(false); onClose() }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.white,borderRadius:4,padding:28,maxWidth:440,width:'100%',border:`1px solid ${T.n200}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:17,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:700}}>Edit Guest</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:T.n400}}>✕</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {(['first_name','last_name'] as const).map(f=>(
              <div key={f}>
                <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{f.replace('_',' ').toUpperCase()} *</label>
                <input value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
          </div>
          {(['email','phone'] as const).map(f=>(
            <div key={f}>
              <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{f.toUpperCase()}</label>
              <input value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10,marginTop:22,justifyContent:'flex-end'}}>
          <button onClick={onClose} style={{padding:'9px 18px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',color:T.n600}}>CANCEL</button>
          <button onClick={save} disabled={saving||!form.first_name||!form.last_name} style={{padding:'9px 18px',background:T.n800,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',fontWeight:700}}>{saving?'SAVING…':'SAVE CHANGES'}</button>
        </div>
      </div>
    </div>
  )
}


function AddGuestModal({ eventId, onDone, onClose }: { eventId:string; onDone:()=>void; onClose:()=>void }) {
  const [tab,    setTab]    = useState<'single'|'csv'>('single')
  const [form,   setForm]   = useState({ first_name:'', last_name:'', email:'', phone:'' })
  const [csv,    setCsv]    = useState('')
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')
  const T2 = require('@/lib/utils').THEME

  const addSingle = async () => {
    if (!form.first_name||!form.last_name) return
    setSaving(true)
    const { v4: uuid } = await import('uuid')
    const { error } = await (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).from('guests').insert({
      event_id:eventId, first_name:form.first_name.trim(), last_name:form.last_name.trim(),
      email:form.email.trim()||null, phone:form.phone.trim()||null,
      guest_token:uuid(), qr_token:uuid(), status:'invited',
    })
    setSaving(false)
    if (error) { setMsg('Error: '+error.message); return }
    setMsg('Guest added!'); setTimeout(()=>{ onDone(); onClose() }, 700)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#FAFAF8',borderRadius:4,padding:28,maxWidth:480,width:'100%',border:'1px solid #DDD8CF',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontSize:17,fontFamily:"'Georgia',serif",color:'#2A2520',fontWeight:700}}>Add Guests</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'#A09890'}}>✕</button>
        </div>
        <div style={{display:'flex',gap:0,borderBottom:'1px solid #DDD8CF',marginBottom:18}}>
          {(['single','csv'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',background:'none',border:'none',borderBottom:`2px solid ${tab===t?'#2A2520':'transparent'}`,cursor:'pointer',fontSize:10,letterSpacing:'0.12em',fontFamily:'sans-serif',color:tab===t?'#2A2520':'#A09890',fontWeight:tab===t?700:400,marginBottom:-1}}>
              {t==='single'?'SINGLE GUEST':'CSV IMPORT'}
            </button>
          ))}
        </div>
        {tab==='single'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {(['first_name','last_name'] as const).map(f=>(
                <div key={f}>
                  <label style={{display:'block',fontSize:9,letterSpacing:'0.18em',color:'#A09890',fontFamily:'sans-serif',marginBottom:4}}>{f.replace('_',' ').toUpperCase()} *</label>
                  <input value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:'1px solid #DDD8CF',borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:'#2A2520',outline:'none',boxSizing:'border-box' as const}}/>
                </div>
              ))}
            </div>
            {(['email','phone'] as const).map(f=>(
              <div key={f}>
                <label style={{display:'block',fontSize:9,letterSpacing:'0.18em',color:'#A09890',fontFamily:'sans-serif',marginBottom:4}}>{f.toUpperCase()}</label>
                <input value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:'1px solid #DDD8CF',borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:'#2A2520',outline:'none',boxSizing:'border-box' as const}}/>
              </div>
            ))}
            <button onClick={addSingle} disabled={saving||!form.first_name||!form.last_name}
              style={{padding:'11px',background:'#2A2520',color:'#FAFAF8',border:'none',borderRadius:2,cursor:'pointer',fontSize:11,letterSpacing:'0.15em',fontFamily:'sans-serif',fontWeight:700,marginTop:4}}>
              {saving?'ADDING…':'ADD GUEST'}
            </button>
          </div>
        )}
        {tab==='csv'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontSize:11,color:'#5C5650',fontFamily:'sans-serif',lineHeight:1.7,background:'#F0EBE3',padding:'10px 12px',borderRadius:3}}>
              Format: <code>first_name,last_name,email,phone</code><br/>One per line. Header optional.
            </div>
            <textarea value={csv} onChange={e=>setCsv(e.target.value)} rows={5}
              style={{width:'100%',padding:'9px 11px',border:'1px solid #DDD8CF',borderRadius:2,fontSize:12,fontFamily:'monospace',color:'#2A2520',outline:'none',boxSizing:'border-box' as const,resize:'vertical' as const}}/>
            <button onClick={async()=>{
              const lines=csv.trim().split('\n').filter(Boolean); if(!lines.length) return
              setSaving(true)
              const {v4:uuid}=await import('uuid')
              const start=lines[0].toLowerCase().includes('first_name')?1:0
              const rows=lines.slice(start).map(line=>{const [fn='',ln='',em='',ph='']=line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));return{event_id:eventId,first_name:fn,last_name:ln,email:em||null,phone:ph||null,guest_token:uuid(),qr_token:uuid(),status:'invited' as const}}).filter(r=>r.first_name&&r.last_name)
              const {createClient}=await import('@supabase/supabase-js')
              const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
              const {error}=await sb.from('guests').insert(rows)
              setSaving(false)
              if(error){setMsg('Error: '+error.message);return}
              setMsg(`${rows.length} guests imported!`);setTimeout(()=>{onDone();onClose()},900)
            }} disabled={saving||!csv.trim()} style={{padding:'11px',background:'#2A2520',color:'#FAFAF8',border:'none',borderRadius:2,cursor:'pointer',fontSize:11,letterSpacing:'0.15em',fontFamily:'sans-serif',fontWeight:700}}>
              {saving?'IMPORTING…':'IMPORT CSV'}
            </button>
          </div>
        )}
        {msg&&<div style={{marginTop:12,padding:'8px 12px',background:msg.startsWith('Error')?'#FCEAEA':'#EDF7ED',border:`1px solid ${msg.startsWith('Error')?'#E8A8A8':'#A8CFA8'}`,borderRadius:3,fontSize:12,color:msg.startsWith('Error')?'#E51E21':'#1E5C1E',fontFamily:'sans-serif'}}>{msg}</div>}
      </div>
    </div>
  )
}

export default function EventDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const isMobile = useIsMobile()
  const eventId  = params.eventId as string

  const [event,   setEvent]   = useState<XinaoEvent|null>(null)
  const [guests,  setGuests]  = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string|null>(null)
  const [tab,     setTab]     = useState<'overview'|'guests'|'scanner'>('overview')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,  setSearch]  = useState('')
  const [preview, setPreview] = useState<string|null>(null)
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<{done:number,total:number,errors:string[]}|null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ids:string[],count:number}|null>(null)
  const [editGuest, setEditGuest] = useState<Guest|null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [manualCode,   setManualCode]   = useState('')
  const [scanResult,   setScanResult]   = useState<{type:string,guest?:Guest}|null>(null)
  const [showAddGuest, setShowAddGuest] = useState(false)

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

  const checkIn = async (guestId: string) => {
    const now = new Date().toISOString()
    setGuests(p => p.map(g => g.id===guestId ? {...g,status:'checked-in' as const,checked_in_at:now} : g))
    await supabase.from('guests').update({status:'checked-in',checked_in_at:now,updated_at:now}).eq('id',guestId)
  }

  const handleScan = useCallback(async (raw: string) => {
    if (!event) return
    let qrToken = raw.trim()
    const match = raw.match(/\/checkin\/[^/]+\/([^/?\s]+)/)
    if (match) qrToken = match[1]
    const g = guests.find(x => x.qr_token === qrToken) ?? guests.find(x => x.qr_token.slice(0,8).toUpperCase() === qrToken.toUpperCase())
    if (!g) { setScanResult({type:'invalid'}); return }
    if (g.status==='checked-in') { setScanResult({type:'already',guest:g}); return }
    await checkIn(g.id)
    setScanResult({type:'success',guest:{...g,status:'checked-in' as const,checked_in_at:new Date().toISOString()}})
  }, [guests, event])

  const saveGuestEdit = async (data: Partial<Guest>) => {
    if (!editGuest) return
    const { error } = await supabase.from('guests').update({...data,updated_at:new Date().toISOString()}).eq('id',editGuest.id)
    if (error) { setError(error.message); return }
    setGuests(p => p.map(g => g.id===editGuest.id ? {...g,...data} : g))
  }

  const deleteGuests = async (ids: string[]) => {
    const { error } = await supabase.from('guests').delete().in('id',ids)
    if (error) { setError(error.message); return }
    setGuests(p => p.filter(g => !ids.includes(g.id)))
    setSelected(new Set()); setDeleteConfirm(null)
  }

  const sendEmail = async (g: Guest, evt: XinaoEvent): Promise<boolean> => {
    try {
      const res = await fetch('/api/send-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({guest:g,event:evt})})
      return res.ok
    } catch { return false }
  }

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

  const toggleOne = (id:string) => setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n})
  const toggleAll = (list:Guest[]) => { if(list.every(g=>selected.has(g.id))) setSelected(new Set()); else setSelected(new Set(list.map(g=>g.id))) }

  const total      = guests.length
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
    <div onClick={()=>toggle(k)} style={{cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',gap:3}}>
      <span style={{fontSize:8,letterSpacing:'0.12em',color:T.n400,fontFamily:'sans-serif',fontWeight:700,whiteSpace:'nowrap'}}>{label}</span>
      <span style={{fontSize:8,color:sk===k?T.gold:T.n300}}>{sk===k?(sd==='asc'?'▲':'▼'):'↕'}</span>
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes scanline{0%{top:20%}50%{top:80%}100%{top:20%}} *{box-sizing:border-box}`}</style>

      {/* Topbar — BACK goes to admin without logout */}
      <div style={{background:T.black,borderBottom:'1px solid #1A1A1A',padding:'0 16px',position:'sticky',top:0,zIndex:200}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:46}}>
          <button onClick={()=>router.push('/admin')} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:10,padding:0}}>
            <span style={{fontSize:14,fontWeight:700,color:T.gold,letterSpacing:'0.12em',fontFamily:"'Georgia',serif"}}>XINAO</span>
            <span style={{width:1,height:11,background:'#2A2520',display:'block'}}/>
            <span style={{fontSize:8,color:T.n600,letterSpacing:'0.22em',fontFamily:'sans-serif'}}>ADMIN DASHBOARD</span>
          </button>
          {/* BACK button — does NOT logout, just goes back */}
          <button onClick={()=>router.push('/admin')} style={{padding:'4px 11px',background:'none',border:'1px solid #2A2520',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.14em',fontFamily:'sans-serif',color:T.n600}}>
            ← BACK
          </button>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'20px 16px'}}>
        <button onClick={()=>router.push('/admin')} style={{background:'none',border:'none',color:T.gold,cursor:'pointer',fontSize:10,letterSpacing:'0.15em',fontFamily:'sans-serif',padding:0,marginBottom:12}}>
          ← ALL EVENTS
        </button>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:10,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:2}}>{event.subtitle||'XINAO EVENT'}</div>
            <div style={{fontSize:isMobile?20:24,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,lineHeight:1.2}}>{event.name}</div>
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
              <div style={{height:3,background:T.n100,borderRadius:2}}><div style={{width:`${regPct}%`,height:'100%',background:`linear-gradient(90deg,${T.gold},${T.goldLight})`,borderRadius:2,transition:'width 0.8s'}}/></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:20}}>
              {STATS.map(s=>(
                <div key={s.key} onClick={()=>{setStatusFilter(s.key);setTab('guests')}}
                  style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'12px 8px',cursor:'pointer',userSelect:'none',textAlign:'center'}}
                  onMouseEnter={e=>e.currentTarget.style.background=s.hover}
                  onMouseLeave={e=>e.currentTarget.style.background=T.white}>
                  <div style={{fontSize:7,letterSpacing:'0.15em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{s.label}</div>
                  <div style={{fontSize:isMobile?22:26,fontFamily:"'Georgia',serif",fontWeight:700,color:s.color,lineHeight:1}}>{s.val}</div>
                  <div style={{fontSize:7,color:T.gold,fontFamily:'sans-serif',marginTop:5}}>LIST →</div>
                </div>
              ))}
            </div>
            {event.cover_image_url&&<div style={{marginBottom:16}}><div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:6}}>INVITATION TEMPLATE</div><img src={event.cover_image_url} alt="template" style={{width:'100%',maxHeight:160,objectFit:'cover',borderRadius:4,border:`1px solid ${T.n200}`}}/></div>}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif'}}>RECENT REGISTRATIONS</div>
              <button onClick={()=>setShowAddGuest(true)} style={{padding:'6px 12px',background:T.n800,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.15em',fontFamily:'sans-serif',fontWeight:700}}>+ ADD GUESTS</button>
            </div>
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
            <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap'}}>
              <input placeholder="Search by name, email…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{flex:1,minWidth:140,padding:'10px 12px',background:T.white,border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none'}}/>
              <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                {['all','invited','registered','checked-in'].map(s=>(
                  <button key={s} onClick={()=>setStatusFilter(s)}
                    style={{padding:'8px 10px',background:statusFilter===s?T.n800:T.white,color:statusFilter===s?T.white:T.n600,border:`1px solid ${statusFilter===s?T.n800:T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.06em',fontFamily:'sans-serif',fontWeight:statusFilter===s?700:400,whiteSpace:'nowrap'}}>
                    {s==='checked-in'?'✓ IN':s==='all'?'ALL':s.charAt(0).toUpperCase()+s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {someChecked&&(
              <div style={{background:T.n800,borderRadius:4,padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:T.white,fontFamily:'sans-serif',fontWeight:700}}>{selected.size} selected</span>
                <div style={{display:'flex',gap:8,marginLeft:'auto',flexWrap:'wrap'}}>
                  <button onClick={bulkSend} disabled={bulkSending} style={{padding:'7px 14px',background:T.gold,color:T.black,border:'none',borderRadius:2,cursor:bulkSending?'not-allowed':'pointer',fontSize:10,letterSpacing:'0.1em',fontFamily:'sans-serif',fontWeight:700}}>
                    {bulkSending?`✉ ${sendProgress?.done}/${sendProgress?.total}…`:`✉ SEND (${selected.size})`}
                  </button>
                  <button onClick={()=>setDeleteConfirm({ids:Array.from(selected),count:selected.size})} style={{padding:'7px 14px',background:T.red,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:10,letterSpacing:'0.1em',fontFamily:'sans-serif',fontWeight:700}}>
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

            {/* ── MOBILE: card list ── */}
            {isMobile ? (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {sorted.length===0&&<div style={{padding:'24px',textAlign:'center',color:T.n400,fontSize:12,fontFamily:'sans-serif',background:T.white,border:`1px solid ${T.n200}`,borderRadius:4}}>No guests match.</div>}
                {sorted.map(g=>(
                  <div key={g.id} style={{background:T.white,border:`1px solid ${selected.has(g.id)?T.gold:T.n200}`,borderRadius:4,overflow:'hidden'}}>
                    <div style={{padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:10}}>
                      <input type="checkbox" checked={selected.has(g.id)} onChange={()=>toggleOne(g.id)} style={{marginTop:3,flexShrink:0,width:16,height:16,cursor:'pointer'}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600}}>{g.first_name} {g.last_name}</div>
                        {g.email&&<div style={{fontSize:11,color:T.n400,fontFamily:'sans-serif',marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.email}</div>}
                        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:6,flexWrap:'wrap'}}>
                          <Badge status={g.status}/>
                          {g.registered_at&&<span style={{fontSize:10,color:T.n400,fontFamily:'sans-serif'}}>{fmtDate(g.registered_at)}</span>}
                        </div>
                      </div>
                      <button onClick={()=>setPreview(preview===g.id?null:g.id)}
                        style={{flexShrink:0,width:36,height:36,background:preview===g.id?T.n800:T.n100,border:`1px solid ${preview===g.id?T.n800:T.n200}`,borderRadius:3,cursor:'pointer',fontSize:14,color:preview===g.id?T.gold:T.n600,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {preview===g.id?'▲':'▼'}
                      </button>
                    </div>
                    {/* Mobile action buttons */}
                    <div style={{display:'flex',gap:0,borderTop:`1px solid ${T.n100}`}}>
                      <button onClick={()=>setEditGuest(g)} style={{flex:1,padding:'10px',background:'none',border:'none',borderRight:`1px solid ${T.n100}`,cursor:'pointer',fontSize:11,color:T.n600,fontFamily:'sans-serif'}}>✎ Edit</button>
                      {g.email&&<button onClick={async()=>await sendEmail(g,event!)} style={{flex:1,padding:'10px',background:'none',border:'none',borderRight:`1px solid ${T.n100}`,cursor:'pointer',fontSize:11,color:T.gold,fontFamily:'sans-serif'}}>✉ Send</button>}
                      {g.status!=='checked-in'&&<button onClick={()=>checkIn(g.id)} style={{flex:1,padding:'10px',background:'none',border:'none',borderRight:`1px solid ${T.n100}`,cursor:'pointer',fontSize:11,color:T.green,fontFamily:'sans-serif',fontWeight:700}}>✓ IN</button>}
                      <button onClick={()=>setDeleteConfirm({ids:[g.id],count:1})} style={{flex:1,padding:'10px',background:'none',border:'none',cursor:'pointer',fontSize:11,color:T.red,fontFamily:'sans-serif',fontWeight:700}}>✕</button>
                    </div>
                    {/* Expanded */}
                    {preview===g.id&&(
                      <div style={{padding:'16px 14px',background:'#F9F7F2',borderTop:`1px solid ${T.n100}`}}>
                        <div style={{display:'flex',justifyContent:'center',marginBottom:12}}><InvitationCard guest={g} event={event} showDownload/></div>
                        <div style={{fontSize:9,letterSpacing:'0.18em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>SHORT CHECK-IN CODE</div>
                        <div style={{fontSize:18,fontFamily:'monospace',fontWeight:700,color:T.gold,background:T.goldBg,padding:'6px 12px',borderRadius:3,letterSpacing:'0.15em',display:'inline-block',marginBottom:10}}>
                          {g.qr_token.slice(0,8).toUpperCase()}
                        </div>
                        <div style={{fontSize:9,letterSpacing:'0.18em',color:T.n400,fontFamily:'sans-serif',marginBottom:5,marginTop:8}}>INVITATION LINK</div>
                        <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                          <code style={{fontSize:10,color:T.gold,background:T.n100,padding:'4px 7px',borderRadius:2,wordBreak:'break-all'}}>{SITE}/invite/{eventId}/{g.guest_token}</code>
                          <button onClick={()=>navigator.clipboard.writeText(`${SITE}/invite/${eventId}/${g.guest_token}`)} style={{padding:'5px 10px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,fontFamily:'sans-serif',color:T.n600,flexShrink:0}}>COPY</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* ── DESKTOP: table ── */
              <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'32px 1fr 1fr 110px 100px 70px 36px',padding:'9px 14px',borderBottom:`1px solid ${T.n100}`,background:T.n100,gap:8,alignItems:'center'}}>
                  <input type="checkbox" checked={allChecked} onChange={()=>toggleAll(sorted)} style={{cursor:'pointer',width:13,height:13}}/>
                  <SortCol k="last_name"     label="LAST NAME"/>
                  <SortCol k="first_name"    label="FIRST NAME"/>
                  <SortCol k="status"        label="STATUS"/>
                  <SortCol k="registered_at" label="REG."/>
                  <div style={{fontSize:8,letterSpacing:'0.12em',color:T.n400,fontFamily:'sans-serif',fontWeight:700}}>ACTIONS</div>
                  <div/>
                </div>
                {sorted.length===0&&<div style={{padding:'24px',textAlign:'center',color:T.n400,fontSize:12,fontFamily:'sans-serif'}}>No guests match.</div>}
                {sorted.map(g=>(
                  <div key={g.id}>
                    <div style={{display:'grid',gridTemplateColumns:'32px 1fr 1fr 110px 100px 70px 36px',padding:'10px 14px',alignItems:'center',borderBottom:`1px solid ${T.n100}`,gap:8,background:selected.has(g.id)?'#F5F2ED':preview===g.id?'#F9F7F2':'transparent'}}>
                      <input type="checkbox" checked={selected.has(g.id)} onChange={()=>toggleOne(g.id)} style={{cursor:'pointer',width:13,height:13}}/>
                      <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.last_name}</div>
                      <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.first_name}</div>
                      <div style={{display:'flex',alignItems:'center'}}><Badge status={g.status}/></div>
                      <div style={{fontSize:11,color:T.n400,fontFamily:'sans-serif',whiteSpace:'nowrap'}}>{fmtDate(g.registered_at)}</div>
                      <div style={{display:'flex',gap:3}}>
                        <button onClick={()=>setEditGuest(g)} title="Edit" style={{width:28,height:26,background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,color:T.n600,display:'flex',alignItems:'center',justifyContent:'center'}}>✎</button>
                        {g.email&&<button onClick={async()=>await sendEmail(g,event!)} title="Send email" style={{width:28,height:26,background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,color:T.gold,display:'flex',alignItems:'center',justifyContent:'center'}}>✉</button>}
                        <button onClick={()=>setDeleteConfirm({ids:[g.id],count:1})} title="Delete" style={{width:28,height:26,background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,color:T.red,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                      </div>
                      <button onClick={()=>setPreview(preview===g.id?null:g.id)} style={{width:34,height:30,background:preview===g.id?T.n800:T.white,border:`1px solid ${preview===g.id?T.n800:T.n200}`,borderRadius:3,cursor:'pointer',fontSize:12,color:preview===g.id?T.gold:T.n600,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {preview===g.id?'▲':'▼'}
                      </button>
                    </div>
                    {preview===g.id&&(
                      <div style={{padding:'18px 16px',background:'#F9F7F2',borderBottom:`1px solid ${T.n100}`}}>
                        <div style={{fontSize:8,letterSpacing:'0.25em',color:T.n400,fontFamily:'sans-serif',marginBottom:14}}>INVITATION — {g.first_name.toUpperCase()} {g.last_name.toUpperCase()}</div>
                        <div style={{display:'flex',gap:24,flexWrap:'wrap',alignItems:'flex-start'}}>
                          <InvitationCard guest={g} event={event} showDownload/>
                          <div style={{display:'flex',flexDirection:'column',gap:11,minWidth:200,flex:1}}>
                            {[['EMAIL',g.email??'—'],['PHONE',g.phone??'—']].map(([l,v])=>(
                              <div key={l}><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:3}}>{l}</div><div style={{fontSize:12,color:T.n800,fontFamily:'sans-serif'}}>{v}</div></div>
                            ))}
                            <div><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>STATUS</div><Badge status={g.status}/></div>
                            {g.registered_at&&<div><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:3}}>REGISTERED</div><div style={{fontSize:12,color:T.n800,fontFamily:'sans-serif'}}>{fmtDate(g.registered_at)} {fmtTime(g.registered_at)}</div></div>}
                            {g.checked_in_at&&<div><div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:3}}>CHECKED IN</div><div style={{fontSize:12,color:T.gold,fontWeight:700,fontFamily:'sans-serif'}}>{fmtDate(g.checked_in_at)} {fmtTime(g.checked_in_at)}</div></div>}
                            <div>
                              <div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>SHORT CODE</div>
                              <div style={{fontSize:16,fontFamily:'monospace',fontWeight:700,color:T.gold,background:T.goldBg,padding:'5px 10px',borderRadius:3,letterSpacing:'0.15em',display:'inline-block'}}>{g.qr_token.slice(0,8).toUpperCase()}</div>
                            </div>
                            <div>
                              <div style={{fontSize:8,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>INVITATION LINK</div>
                              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                                <code style={{fontSize:10,color:T.gold,background:T.n100,padding:'4px 8px',borderRadius:2,wordBreak:'break-all'}}>{SITE}/invite/{eventId}/{g.guest_token}</code>
                                <button onClick={()=>navigator.clipboard.writeText(`${SITE}/invite/${eventId}/${g.guest_token}`)} style={{padding:'4px 10px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,fontFamily:'sans-serif',color:T.n600,flexShrink:0}}>COPY</button>
                              </div>
                            </div>
                            <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                              {g.status==='registered'&&<button onClick={()=>{checkIn(g.id);setPreview(null)}} style={{padding:'8px 14px',background:T.n800,color:T.gold,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>✓ CHECK IN</button>}
                              {g.status==='invited'&&<button onClick={()=>{checkIn(g.id);setPreview(null)}} style={{padding:'8px 14px',background:T.green,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>✓ FORCE CHECK IN</button>}
                              {g.email&&<button onClick={()=>sendEmail(g,event!)} style={{padding:'8px 14px',background:'none',border:`1px solid ${T.gold}`,color:T.gold,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>✉ SEND EMAIL</button>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SCANNER ── */}
        {tab==='scanner'&&(
          <div style={{maxWidth:400,margin:'0 auto',paddingTop:12}}>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:9,color:T.gold,letterSpacing:'0.3em',fontFamily:'sans-serif',marginBottom:3}}>QR SCANNER</div>
              <div style={{fontSize:16,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800}}>{event.name}</div>
              <div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif',marginTop:2}}>{guests.filter(g=>g.status==='registered').length} waiting · {guests.filter(g=>g.status==='checked-in').length} checked in</div>
            </div>
            <QRScanner active={cameraActive} onScan={(raw)=>{handleScan(raw);setCameraActive(false)}}/>
            <button onClick={()=>{setScanResult(null);setCameraActive(a=>!a)}}
              style={{width:'100%',padding:'13px 0',background:cameraActive?T.red:T.gold,color:cameraActive?T.white:T.black,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:'0.2em',fontFamily:'sans-serif',marginTop:10,marginBottom:10}}>
              {cameraActive?'⬛ STOP CAMERA':'📷 START CAMERA'}
            </button>
            <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:16,marginBottom:14}}>
              <div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:8}}>MANUAL CHECK-IN — SHORT CODE</div>
              <div style={{display:'flex',gap:7}}>
                <input value={manualCode} onChange={e=>setManualCode(e.target.value.toUpperCase())} placeholder="e.g. A1B2C3D4"
                  onKeyDown={e=>{if(e.key==='Enter'){handleScan(manualCode);setManualCode('')}}}
                  style={{flex:1,padding:'11px 12px',background:T.n100,border:`1px solid ${T.n200}`,borderRadius:2,fontSize:14,fontFamily:'monospace',color:T.n800,outline:'none',letterSpacing:'0.1em'}}/>
                <button onClick={()=>{handleScan(manualCode);setManualCode('')}}
                  style={{padding:'11px 16px',background:T.n800,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',fontWeight:700}}>IN</button>
              </div>
            </div>
            {scanResult&&(()=>{
              const R=RES[scanResult.type as keyof typeof RES]
              return(
                <div style={{padding:20,background:R.bg,border:`1px solid ${R.border}`,borderRadius:4,textAlign:'center',marginBottom:14}}>
                  <div style={{fontSize:36,color:R.color,marginBottom:6}}>{R.icon}</div>
                  <div style={{fontSize:12,color:R.color,letterSpacing:'0.2em',fontFamily:'sans-serif',fontWeight:700}}>{R.label}</div>
                  {scanResult.guest&&<div style={{fontSize:20,color:'#FAFAF8',fontFamily:"'Georgia',serif",marginTop:7,fontWeight:700}}>{scanResult.guest.first_name} {scanResult.guest.last_name}</div>}
                  <button onClick={()=>{setScanResult(null);setManualCode('');setCameraActive(true)}}
                    style={{marginTop:12,padding:'10px 24px',background:T.gold,color:T.black,border:'none',cursor:'pointer',borderRadius:2,fontSize:10,letterSpacing:'0.2em',fontFamily:'sans-serif',fontWeight:700}}>
                    SCAN NEXT →
                  </button>
                </div>
              )
            })()}
            {/* Quick guest list */}
            <div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:8}}>GUEST LIST</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {guests.map(g=>(
                <div key={g.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:'10px 14px',gap:8}}>
                  <div>
                    <div style={{fontSize:13,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:600}}>{g.first_name} {g.last_name}</div>
                    <div style={{fontSize:10,fontFamily:'monospace',color:T.n400,marginTop:1}}>{g.qr_token.slice(0,8).toUpperCase()}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <Badge status={g.status}/>
                    {g.status!=='checked-in'&&<button onClick={()=>checkIn(g.id)} style={{padding:'5px 10px',background:T.green,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.1em',fontFamily:'sans-serif',fontWeight:700}}>✓ IN</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {deleteConfirm&&<ConfirmModal title="Delete" message={deleteConfirm.count===1?'Delete this guest?':`Delete ${deleteConfirm.count} guests?`} onConfirm={()=>deleteGuests(deleteConfirm.ids)} onCancel={()=>setDeleteConfirm(null)} danger/>}
      {editGuest&&<EditGuestModal guest={editGuest} onSave={saveGuestEdit} onClose={()=>setEditGuest(null)}/> }
      {showAddGuest&&<AddGuestModal eventId={eventId} onDone={load} onClose={()=>setShowAddGuest(false)}/>}
      {error&&(
        <div style={{position:'fixed',bottom:20,left:'50%',transform:'translateX(-50%)',background:T.red,color:T.white,padding:'10px 20px',borderRadius:4,fontSize:12,fontFamily:'sans-serif',zIndex:500,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',maxWidth:'90vw',textAlign:'center'}}>
          ⚠ {error}
          <button onClick={()=>setError(null)} style={{marginLeft:12,background:'none',border:'none',color:T.white,cursor:'pointer',fontSize:14}}>✕</button>
        </div>
      )}
    </div>
  )
}
