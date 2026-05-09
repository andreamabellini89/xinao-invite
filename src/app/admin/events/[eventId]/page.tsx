'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { Badge } from '@/components/Badge'
import { InvitationCard } from '@/components/InvitationCard'
import { THEME as T, fmtDate, fmtTime } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import type { XinaoEvent, Guest } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? ''

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
  title: string; message: string; onConfirm: ()=>void; onCancel: ()=>void; danger?: boolean
}) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:T.white, borderRadius:4, padding:28, maxWidth:400, width:'100%', border:`1px solid ${T.n200}` }}>
        <div style={{ fontSize:17, fontFamily:"'Georgia',serif", color:T.n800, marginBottom:10 }}>{title}</div>
        <div style={{ fontSize:13, fontFamily:'sans-serif', color:T.n600, lineHeight:1.7, marginBottom:24 }}>{message}</div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onCancel} style={{ padding:'9px 18px', background:'none', border:`1px solid ${T.n200}`, borderRadius:2, cursor:'pointer', fontSize:11, letterSpacing:'0.1em', fontFamily:'sans-serif', color:T.n600 }}>CANCEL</button>
          <button onClick={onConfirm} style={{ padding:'9px 18px', background:danger?T.red:T.n800, border:'none', borderRadius:2, cursor:'pointer', fontSize:11, letterSpacing:'0.1em', fontFamily:'sans-serif', color:T.white, fontWeight:700 }}>
            {danger ? 'DELETE' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  )
}

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

  // ── Selection state ──
  const [selected,    setSelected]    = useState<Set<string>>(new Set())
  const [bulkSending, setBulkSending] = useState(false)
  const [sendProgress, setSendProgress] = useState<{done:number,total:number,errors:string[]}|null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ids:string[],count:number}|null>(null)

  // ── Scanner state ──
  const [scanToken,  setScanToken]  = useState('')
  const [scanning,   setScanning]   = useState(false)
  const [scanResult, setScanResult] = useState<{type:string,guest?:Guest}|null>(null)

  // ── Load ──
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [{ data: evt, error: e1 }, { data: gsts, error: e2 }] = await Promise.all([
        supabase.from('events').select('*').eq('id', eventId).single(),
        supabase.from('guests').select('*').eq('event_id', eventId).order('last_name'),
      ])
      if (e1) throw e1
      if (e2) throw e2
      setEvent(evt)
      setGuests(gsts ?? [])
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [eventId])

  useEffect(() => { load() }, [load])

  // ── Check-in ──
  const checkIn = async (guestId: string) => {
    const now = new Date().toISOString()
    setGuests(p => p.map(g => g.id===guestId ? {...g, status:'checked-in' as const, checked_in_at:now} : g))
    await supabase.from('guests').update({ status:'checked-in', checked_in_at:now, updated_at:now }).eq('id', guestId)
  }

  // ── Delete guests ──
  const deleteGuests = async (ids: string[]) => {
    const { error } = await supabase.from('guests').delete().in('id', ids)
    if (error) { setError(error.message); return }
    setGuests(p => p.filter(g => !ids.includes(g.id)))
    setSelected(new Set())
    setDeleteConfirm(null)
  }

  // ── Send invitation email ──
  const sendEmail = async (guest: Guest, event: XinaoEvent): Promise<boolean> => {
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest, event }),
      })
      return res.ok
    } catch { return false }
  }

  // ── Bulk send ──
  const bulkSend = async () => {
    if (!event || selected.size === 0) return
    const toSend = guests.filter(g => selected.has(g.id) && g.email)
    if (toSend.length === 0) {
      setError('None of the selected guests have an email address.')
      return
    }
    setBulkSending(true)
    setSendProgress({ done:0, total:toSend.length, errors:[] })

    const errors: string[] = []
    for (let i = 0; i < toSend.length; i++) {
      const ok = await sendEmail(toSend[i], event)
      if (!ok) errors.push(`${toSend[i].first_name} ${toSend[i].last_name}`)
      setSendProgress({ done:i+1, total:toSend.length, errors })
      // Small delay to avoid rate limiting
      if (i < toSend.length - 1) await new Promise(r => setTimeout(r, 300))
    }

    setBulkSending(false)
    setTimeout(() => { setSendProgress(null); setSelected(new Set()) }, 4000)
  }

  // ── Selection helpers ──
  const toggleOne = (id: string) => setSelected(s => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })
  const toggleAll = (list: Guest[]) => {
    if (list.every(g => selected.has(g.id))) setSelected(new Set())
    else setSelected(new Set(list.map(g => g.id)))
  }

  // ── Scanner ──
  const checkQR = async (qr: string) => {
    const g = guests.find(x => x.qr_token === qr)
    if (!g) return setScanResult({ type:'invalid' })
    if (g.status === 'checked-in') return setScanResult({ type:'already', guest:g })
    await checkIn(g.id)
    setScanResult({ type:'success', guest:{...g, status:'checked-in' as const, checked_in_at:new Date().toISOString()} })
  }
  const simulateScan = () => {
    setScanning(true)
    setTimeout(() => {
      const el = guests.filter(g => g.status === 'registered')
      el.length ? checkQR(el[Math.floor(Math.random()*el.length)].qr_token) : setScanResult({type:'invalid'})
      setScanning(false)
    }, 900)
  }

  // ── Derived ──
  const counts = {
    total:      guests.length,
    registered: guests.filter(g=>g.status==='registered').length,
    checkedIn:  guests.filter(g=>g.status==='checked-in').length,
    invited:    guests.filter(g=>g.status==='invited').length,
  }
  const regPct = counts.total ? Math.round(((counts.registered+counts.checkedIn)/counts.total)*100) : 0

  const filtered = guests.filter(g => {
    const q = search.toLowerCase()
    return (!q || `${g.first_name} ${g.last_name} ${g.email??''}`.toLowerCase().includes(q))
      && (statusFilter==='all' || g.status===statusFilter)
  })
  const { sorted, key:sk, dir:sd, toggle } = useSort(filtered, 'last_name')

  const allChecked = sorted.length > 0 && sorted.every(g => selected.has(g.id))
  const someChecked = sorted.some(g => selected.has(g.id))

  const SortCol = ({ k, label }: { k:keyof Guest; label:string }) => (
    <div onClick={()=>toggle(k)} style={{ cursor:'pointer', userSelect:'none', display:'flex', alignItems:'center', gap:3 }}>
      <span style={{ fontSize:8, letterSpacing:'0.15em', color:T.n400, fontFamily:'sans-serif', fontWeight:700 }}>{label}</span>
      <span style={{ fontSize:8, color:sk===k?T.gold:T.n300 }}>{sk===k?(sd==='asc'?'▲':'▼'):'↕'}</span>
    </div>
  )

  const STATS = [
    { key:'all',        label:'TOTAL',   val:counts.total,      color:T.n800, hover:T.n100   },
    { key:'registered', label:'REG.',    val:counts.registered, color:T.green,hover:T.greenBg},
    { key:'checked-in', label:'IN',      val:counts.checkedIn,  color:T.gold, hover:T.goldBg },
    { key:'invited',    label:'WAITING', val:counts.invited,    color:T.n400, hover:T.n100   },
  ]
  const RES = {
    success: { bg:'#061606', border:'#2D6B2D', color:'#7EC87E', icon:'✓', label:'ACCESS GRANTED' },
    already: { bg:'#160606', border:T.red,     color:'#E57E7E', icon:'⚠', label:'ALREADY CHECKED IN' },
    invalid: { bg:'#160606', border:T.red,     color:'#E57E7E', icon:'✕', label:'INVALID INVITATION' },
  }

  // ── Loading / Error ──
  if (loading) return (
    <div style={{ minHeight:'100vh', background:T.n100, display:'flex', alignItems:'center', justifyContent:'center', color:T.n400, fontFamily:'sans-serif' }}>
      Loading event…
    </div>
  )
  if (error || !event) return (
    <div style={{ minHeight:'100vh', background:T.n100, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div style={{ color:T.red, fontFamily:'sans-serif', fontSize:13 }}>Error: {error ?? 'Event not found'}</div>
      <a href="/admin" style={{ color:T.gold, fontFamily:'sans-serif', fontSize:11, letterSpacing:'0.15em', textDecoration:'none' }}>← BACK TO ADMIN</a>
    </div>
  )

  return (
    <div style={{ fontFamily:"'Georgia',serif", background:T.n100, minHeight:'100vh' }}>
      <TopBar section="ADMIN DASHBOARD" onBack={() => router.push('/admin')} />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

        <button onClick={() => router.push('/admin')} style={{ background:'none', border:'none', color:T.gold, cursor:'pointer', fontSize:10, letterSpacing:'0.15em', fontFamily:'sans-serif', padding:0, marginBottom:14 }}>
          ← ALL EVENTS
        </button>

        {/* Event header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:9, letterSpacing:'0.3em', color:T.gold, fontFamily:'sans-serif', marginBottom:3 }}>{event.subtitle||'XINAO EVENT'}</div>
            <div style={{ fontSize:24, fontFamily:"'Georgia',serif", fontWeight:700, color:T.n800, lineHeight:1.2 }}>{event.name}</div>
            <div style={{ fontSize:11, color:T.n400, fontFamily:'sans-serif', marginTop:3 }}>{event.date} · {event.time} · {event.location}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:`1px solid ${T.n200}`, marginBottom:20, overflowX:'auto' }}>
          {(['overview','guests','scanner'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:'8px 16px', background:'none', border:'none', borderBottom:`2px solid ${tab===t?T.n800:'transparent'}`, cursor:'pointer', fontSize:9, letterSpacing:'0.15em', fontFamily:'sans-serif', color:tab===t?T.n800:T.n400, fontWeight:tab===t?700:400, marginBottom:-1, whiteSpace:'nowrap' }}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <div style={{ background:T.white, border:`1px solid ${T.n200}`, borderRadius:4, padding:'12px 16px', marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:9, color:T.n600, fontFamily:'sans-serif', letterSpacing:'0.1em' }}>REGISTRATION PROGRESS</span>
                <span style={{ fontSize:9, color:T.gold, fontFamily:'sans-serif', fontWeight:700 }}>{regPct}%</span>
              </div>
              <div style={{ height:3, background:T.n100, borderRadius:2 }}>
                <div style={{ width:`${regPct}%`, height:'100%', background:`linear-gradient(90deg,${T.gold},${T.goldLight})`, borderRadius:2, transition:'width 0.8s ease' }}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:24 }}>
              {STATS.map(s => (
                <div key={s.key} onClick={() => { setStatusFilter(s.key); setTab('guests') }}
                  style={{ background:T.white, border:`1px solid ${T.n200}`, borderRadius:4, padding:'14px 10px', cursor:'pointer', userSelect:'none', textAlign:'center' }}
                  onMouseEnter={e => e.currentTarget.style.background=s.hover}
                  onMouseLeave={e => e.currentTarget.style.background=T.white}>
                  <div style={{ fontSize:7, letterSpacing:'0.15em', color:T.n400, fontFamily:'sans-serif', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:28, fontFamily:"'Georgia',serif", fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
                  <div style={{ fontSize:7, color:T.gold, fontFamily:'sans-serif', marginTop:6 }}>LIST →</div>
                </div>
              ))}
            </div>
            {event.cover_image_url && (
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:9, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:8 }}>INVITATION TEMPLATE</div>
                <img src={event.cover_image_url} alt="template" style={{ width:'100%', maxHeight:180, objectFit:'cover', borderRadius:4, border:`1px solid ${T.n200}` }}/>
              </div>
            )}
            <div style={{ fontSize:9, letterSpacing:'0.22em', color:T.n400, fontFamily:'sans-serif', marginBottom:10 }}>RECENT REGISTRATIONS</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {guests.filter(g=>g.registered_at).sort((a,b)=>new Date(b.registered_at!).getTime()-new Date(a.registered_at!).getTime()).slice(0,5).map(g => (
                <div key={g.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:T.white, border:`1px solid ${T.n200}`, borderRadius:4, padding:'10px 14px', gap:10, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:13, fontFamily:"'Georgia',serif", color:T.n800 }}>{g.first_name} {g.last_name}</div>
                    <div style={{ fontSize:10, color:T.n400, fontFamily:'sans-serif' }}>{g.email}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:10, color:T.n400, fontFamily:'sans-serif' }}>{fmtDate(g.registered_at)}</span>
                    <Badge status={g.status}/>
                  </div>
                </div>
              ))}
              {guests.filter(g=>g.registered_at).length === 0 && (
                <div style={{ padding:'22px', textAlign:'center', color:T.n400, fontSize:12, fontFamily:'sans-serif', background:T.white, border:`1px solid ${T.n200}`, borderRadius:4 }}>No registrations yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ── GUESTS ── */}
        {tab === 'guests' && (
          <div>
            {/* Search + filter */}
            <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
              <input placeholder="Search by name, email…" value={search} onChange={e=>setSearch(e.target.value)}
                style={{ flex:1, minWidth:180, padding:'10px 12px', background:T.white, border:`1px solid ${T.n200}`, borderRadius:2, fontSize:13, fontFamily:'sans-serif', color:T.n800, outline:'none' }}/>
              {['all','invited','registered','checked-in'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  style={{ padding:'8px 12px', background:statusFilter===s?T.n800:T.white, color:statusFilter===s?T.white:T.n600, border:`1px solid ${statusFilter===s?T.n800:T.n200}`, borderRadius:2, cursor:'pointer', fontSize:9, letterSpacing:'0.08em', fontFamily:'sans-serif', fontWeight:statusFilter===s?700:400, whiteSpace:'nowrap' }}>
                  {s==='checked-in'?'✓ IN':s==='all'?'ALL':s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>

            {/* ── BULK ACTION BAR — appears when guests selected ── */}
            {someChecked && (
              <div style={{ background:T.n800, borderRadius:4, padding:'12px 16px', marginBottom:12, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:T.white, fontFamily:'sans-serif', fontWeight:700 }}>
                  {selected.size} selected
                </span>
                <div style={{ display:'flex', gap:8, marginLeft:'auto', flexWrap:'wrap' }}>
                  {/* Send invitations */}
                  <button onClick={bulkSend} disabled={bulkSending}
                    style={{ padding:'8px 16px', background:T.gold, color:T.black, border:'none', borderRadius:2, cursor:bulkSending?'not-allowed':'pointer', fontSize:10, letterSpacing:'0.15em', fontFamily:'sans-serif', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                    {bulkSending ? `✉ Sending ${sendProgress?.done}/${sendProgress?.total}…` : `✉ SEND INVITATIONS (${selected.size})`}
                  </button>
                  {/* Delete selected */}
                  <button
                    onClick={() => setDeleteConfirm({ ids: Array.from(selected), count: selected.size })}
                    style={{ padding:'8px 16px', background:T.red, color:T.white, border:'none', borderRadius:2, cursor:'pointer', fontSize:10, letterSpacing:'0.15em', fontFamily:'sans-serif', fontWeight:700 }}>
                    ✕ DELETE ({selected.size})
                  </button>
                  {/* Deselect */}
                  <button onClick={() => setSelected(new Set())}
                    style={{ padding:'8px 12px', background:'none', border:'1px solid #3A3520', color:T.n400, borderRadius:2, cursor:'pointer', fontSize:10, fontFamily:'sans-serif' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Send progress result */}
            {sendProgress && !bulkSending && (
              <div style={{ marginBottom:12, padding:'10px 14px', background: sendProgress.errors.length===0?T.greenBg:T.goldBg, border:`1px solid ${sendProgress.errors.length===0?T.greenBorder:T.goldBorder}`, borderRadius:3, fontSize:12, color: sendProgress.errors.length===0?T.green:T.gold, fontFamily:'sans-serif' }}>
                {sendProgress.errors.length === 0
                  ? `✓ ${sendProgress.total} invitation${sendProgress.total!==1?'s':''} sent successfully.`
                  : `✓ ${sendProgress.done - sendProgress.errors.length} sent. Failed: ${sendProgress.errors.join(', ')}`
                }
              </div>
            )}

            <div style={{ fontSize:10, color:T.n400, fontFamily:'sans-serif', marginBottom:10 }}>{sorted.length} guest{sorted.length!==1?'s':''}</div>

            {/* Table */}
            <div style={{ background:T.white, border:`1px solid ${T.n200}`, borderRadius:4, overflow:'hidden' }}>
              {/* Header */}
              <div style={{ display:'grid', gridTemplateColumns:'36px 1fr 1fr 120px 110px 80px 44px', padding:'9px 14px', borderBottom:`1px solid ${T.n100}`, background:T.n100, gap:8, alignItems:'center' }}>
                {/* Select all checkbox */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <input type="checkbox" checked={allChecked} onChange={() => toggleAll(sorted)}
                    style={{ cursor:'pointer', width:14, height:14 }}/>
                </div>
                <SortCol k="last_name"     label="LAST NAME"/>
                <SortCol k="first_name"    label="FIRST NAME"/>
                <SortCol k="status"        label="STATUS"/>
                <SortCol k="registered_at" label="REGISTERED"/>
                <div style={{ fontSize:8, letterSpacing:'0.15em', color:T.n400, fontFamily:'sans-serif', fontWeight:700 }}>ACTIONS</div>
                <div/>
              </div>

              {sorted.length === 0 && (
                <div style={{ padding:'28px', textAlign:'center', color:T.n400, fontSize:12, fontFamily:'sans-serif' }}>No guests match your filters.</div>
              )}

              {sorted.map(g => (
                <div key={g.id}>
                  <div style={{ display:'grid', gridTemplateColumns:'36px 1fr 1fr 120px 110px 80px 44px', padding:'11px 14px', alignItems:'center', borderBottom:`1px solid ${T.n100}`, gap:8, background:selected.has(g.id)?'#F5F2ED':preview===g.id?'#F9F7F2':'transparent', transition:'background 0.1s' }}>
                    {/* Checkbox */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <input type="checkbox" checked={selected.has(g.id)} onChange={() => toggleOne(g.id)}
                        style={{ cursor:'pointer', width:14, height:14 }}/>
                    </div>
                    <div style={{ fontSize:13, fontFamily:"'Georgia',serif", color:T.n800, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.last_name}</div>
                    <div style={{ fontSize:13, fontFamily:"'Georgia',serif", color:T.n600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.first_name}</div>
                    <div style={{ display:'flex', alignItems:'center' }}><Badge status={g.status}/></div>
                    <div style={{ fontSize:11, color:T.n400, fontFamily:'sans-serif', whiteSpace:'nowrap' }}>{fmtDate(g.registered_at)}</div>
                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:4 }}>
                      {/* Send email */}
                      {g.email && (
                        <button
                          onClick={async () => {
                            const ok = await sendEmail(g, event!)
                            if (!ok) setError(`Failed to send email to ${g.first_name}`)
                          }}
                          title={`Send invitation to ${g.email}`}
                          style={{ width:30, height:28, background:'none', border:`1px solid ${T.n200}`, borderRadius:2, cursor:'pointer', fontSize:12, color:T.gold, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          ✉
                        </button>
                      )}
                      {/* Delete single */}
                      <button
                        onClick={() => setDeleteConfirm({ ids:[g.id], count:1 })}
                        title="Delete guest"
                        style={{ width:30, height:28, background:'none', border:`1px solid ${T.n200}`, borderRadius:2, cursor:'pointer', fontSize:12, color:T.red, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        ✕
                      </button>
                    </div>
                    {/* Expand */}
                    <button onClick={() => setPreview(preview===g.id?null:g.id)}
                      style={{ width:36, height:32, background:preview===g.id?T.n800:T.white, border:`1px solid ${preview===g.id?T.n800:T.n200}`, borderRadius:3, cursor:'pointer', fontSize:13, color:preview===g.id?T.gold:T.n600, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {preview===g.id?'▲':'▼'}
                    </button>
                  </div>

                  {/* Expanded row */}
                  {preview === g.id && (
                    <div style={{ padding:'18px 16px', background:'#F9F7F2', borderBottom:`1px solid ${T.n100}` }}>
                      <div style={{ fontSize:8, letterSpacing:'0.25em', color:T.n400, fontFamily:'sans-serif', marginBottom:14 }}>
                        INVITATION — {g.first_name.toUpperCase()} {g.last_name.toUpperCase()}
                      </div>
                      <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start' }}>
                        <InvitationCard guest={g} event={event} showDownload />
                        <div style={{ display:'flex', flexDirection:'column', gap:11, minWidth:200, flex:1 }}>
                          {[['EMAIL',g.email??'—'],['PHONE',g.phone??'—']].map(([l,v]) => (
                            <div key={l}>
                              <div style={{ fontSize:8, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:3 }}>{l}</div>
                              <div style={{ fontSize:12, color:T.n800, fontFamily:'sans-serif' }}>{v}</div>
                            </div>
                          ))}
                          <div>
                            <div style={{ fontSize:8, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:5 }}>STATUS</div>
                            <Badge status={g.status}/>
                          </div>
                          {g.registered_at && (
                            <div>
                              <div style={{ fontSize:8, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:3 }}>REGISTERED</div>
                              <div style={{ fontSize:12, color:T.n800, fontFamily:'sans-serif' }}>{fmtDate(g.registered_at)} {fmtTime(g.registered_at)}</div>
                            </div>
                          )}
                          {g.checked_in_at && (
                            <div>
                              <div style={{ fontSize:8, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:3 }}>CHECKED IN</div>
                              <div style={{ fontSize:12, color:T.gold, fontWeight:700, fontFamily:'sans-serif' }}>{fmtDate(g.checked_in_at)} {fmtTime(g.checked_in_at)}</div>
                            </div>
                          )}
                          {/* Invite link */}
                          <div>
                            <div style={{ fontSize:8, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:5 }}>INVITATION LINK</div>
                            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                              <code style={{ fontSize:10, color:T.gold, background:T.n100, padding:'4px 8px', borderRadius:2, wordBreak:'break-all' }}>
                                {SITE}/invite/{eventId}/{g.guest_token}
                              </code>
                              <button onClick={() => navigator.clipboard.writeText(`${SITE}/invite/${eventId}/${g.guest_token}`)}
                                style={{ padding:'4px 10px', background:'none', border:`1px solid ${T.n200}`, borderRadius:2, cursor:'pointer', fontSize:9, letterSpacing:'0.1em', fontFamily:'sans-serif', color:T.n600, flexShrink:0 }}>
                                COPY
                              </button>
                            </div>
                          </div>
                          {/* Actions */}
                          <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                            {g.status === 'registered' && (
                              <button onClick={() => { checkIn(g.id); setPreview(null) }}
                                style={{ padding:'8px 14px', background:T.n800, color:T.gold, border:'none', borderRadius:2, cursor:'pointer', fontSize:9, letterSpacing:'0.15em', fontFamily:'sans-serif' }}>
                                MANUAL CHECK-IN
                              </button>
                            )}
                            {g.email && (
                              <button onClick={() => sendEmail(g, event!)}
                                style={{ padding:'8px 14px', background:'none', border:`1px solid ${T.gold}`, color:T.gold, borderRadius:2, cursor:'pointer', fontSize:9, letterSpacing:'0.15em', fontFamily:'sans-serif' }}>
                                ✉ RESEND EMAIL
                              </button>
                            )}
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

        {/* ── SCANNER ── */}
        {tab === 'scanner' && (
          <div style={{ maxWidth:320, margin:'0 auto', paddingTop:20 }}>
            <div style={{ background:T.black, borderRadius:4, padding:'24px 20px' }}>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:9, color:T.gold, letterSpacing:'0.3em', fontFamily:'sans-serif', marginBottom:4 }}>XINAO EVENT STAFF</div>
                <div style={{ fontSize:16, color:'#FAFAF8', fontFamily:"'Georgia',serif", fontWeight:700 }}>QR SCANNER</div>
                <div style={{ fontSize:9, color:T.n400, marginTop:2, letterSpacing:'0.1em', fontFamily:'sans-serif' }}>{event.name.toUpperCase()}</div>
              </div>
              <div style={{ width:'100%', aspectRatio:'1', background:'#111', border:`1px solid ${scanning?T.gold:'#1A1A1A'}`, borderRadius:4, marginBottom:12, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', transition:'border-color 0.3s' }}>
                {[[0,0],[0,1],[1,0],[1,1]].map(([tr,tc],i) => (
                  <div key={i} style={{ position:'absolute', top:tr?'auto':'12px', bottom:tr?'12px':'auto', left:tc?'auto':'12px', right:tc?'12px':'auto', width:18, height:18, borderTop:tr?'none':`2px solid ${T.gold}`, borderBottom:tr?`2px solid ${T.gold}`:'none', borderLeft:tc?'none':`2px solid ${T.gold}`, borderRight:tc?`2px solid ${T.gold}`:'none' }}/>
                ))}
                {scanning
                  ? <div style={{textAlign:'center'}}><div style={{fontSize:26,color:T.gold,animation:'spin 1s linear infinite'}}>◎</div></div>
                  : <div style={{textAlign:'center'}}><div style={{fontSize:32,color:'#1A1A1A'}}>⊟</div><div style={{fontSize:9,color:'#5C5650',marginTop:5,letterSpacing:'0.1em',fontFamily:'sans-serif'}}>CAMERA HERE</div></div>
                }
              </div>
              <button onClick={simulateScan} disabled={scanning}
                style={{ width:'100%', padding:'12px 0', background:scanning?T.n800:T.gold, color:T.black, border:'none', borderRadius:2, cursor:scanning?'not-allowed':'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.18em', fontFamily:'sans-serif', marginBottom:10 }}>
                {scanning ? 'SCANNING…' : 'SIMULATE SCAN'}
              </button>
              <div style={{ display:'flex', gap:7, marginBottom:16 }}>
                <input value={scanToken} onChange={e=>setScanToken(e.target.value)} placeholder="Enter QR token"
                  onKeyDown={e=>e.key==='Enter'&&checkQR(scanToken.trim())}
                  style={{ flex:1, padding:'10px 11px', background:'#111', border:'1px solid #2A2520', borderRadius:2, color:'#FAFAF8', fontSize:12, fontFamily:'sans-serif', outline:'none', minWidth:0 }}/>
                <button onClick={() => checkQR(scanToken.trim())}
                  style={{ padding:'10px 12px', background:'#1A1A1A', border:'1px solid #2A2520', borderRadius:2, color:T.n400, cursor:'pointer', fontSize:11, fontFamily:'sans-serif', flexShrink:0 }}>
                  CHECK
                </button>
              </div>
              {scanResult && (() => {
                const R = RES[scanResult.type as keyof typeof RES]
                return (
                  <div style={{ padding:18, background:R.bg, border:`1px solid ${R.border}`, borderRadius:4, textAlign:'center' }}>
                    <div style={{ fontSize:32, color:R.color, marginBottom:6 }}>{R.icon}</div>
                    <div style={{ fontSize:11, color:R.color, letterSpacing:'0.18em', fontFamily:'sans-serif', fontWeight:700 }}>{R.label}</div>
                    {scanResult.guest && <div style={{ fontSize:16, color:'#FAFAF8', fontFamily:"'Georgia',serif", marginTop:5 }}>{scanResult.guest.first_name} {scanResult.guest.last_name}</div>}
                    {scanResult.type==='already' && scanResult.guest?.checked_in_at && <div style={{ fontSize:10, color:T.n400, marginTop:3, fontFamily:'sans-serif' }}>Checked in at {fmtTime(scanResult.guest.checked_in_at)}</div>}
                    <button onClick={() => { setScanResult(null); setScanToken('') }}
                      style={{ marginTop:10, padding:'7px 16px', background:'transparent', border:'1px solid #2A2520', color:T.n400, cursor:'pointer', borderRadius:2, fontSize:9, letterSpacing:'0.18em', fontFamily:'sans-serif' }}>
                      SCAN NEXT
                    </button>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <ConfirmModal
          title="Delete Guest"
          message={deleteConfirm.count === 1
            ? `Delete this guest? This cannot be undone.`
            : `Delete ${deleteConfirm.count} guests? This cannot be undone.`}
          onConfirm={() => deleteGuests(deleteConfirm.ids)}
          onCancel={() => setDeleteConfirm(null)}
          danger
        />
      )}

      {/* Error toast */}
      {error && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:T.red, color:T.white, padding:'10px 20px', borderRadius:4, fontSize:12, fontFamily:'sans-serif', zIndex:500, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
          ⚠ {error}
          <button onClick={() => setError(null)} style={{ marginLeft:12, background:'none', border:'none', color:T.white, cursor:'pointer', fontSize:14 }}>✕</button>
        </div>
      )}
    </div>
  )
}
