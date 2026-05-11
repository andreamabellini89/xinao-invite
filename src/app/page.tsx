'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/Modal'
import { ImageUpload } from '@/components/ImageUpload'
import { THEME as T } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import type { XinaoEvent, EventFormData } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const ADMIN_PWD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'xinao2026'
const SESSION_KEY = 'xinao_admin_auth'

async function uploadImage(dataUrl: string, eventId: string): Promise<string|null> {
  const res  = await fetch(dataUrl)
  const blob = await res.blob()
  const ext  = blob.type.includes('png') ? 'png' : 'jpg'
  const path = `events/${eventId}/cover.${ext}`
  const { error } = await supabase.storage.from('event-images').upload(path, blob, { upsert:true })
  if (error) { console.error(error); return null }
  const { data } = supabase.storage.from('event-images').getPublicUrl(path)
  return data.publicUrl
}

// ── Add Guest Modal ───────────────────────────────────────────────────────────
function AddGuestModal({ eventId, onDone, onClose }: { eventId:string; onDone:()=>void; onClose:()=>void }) {
  const [tab,    setTab]    = useState<'single'|'csv'>('single')
  const [form,   setForm]   = useState({ first_name:'', last_name:'', email:'', phone:'' })
  const [csv,    setCsv]    = useState('')
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  const addSingle = async () => {
    if (!form.first_name||!form.last_name) return
    setSaving(true)
    const { v4: uuid } = await import('uuid')
    const { error } = await supabase.from('guests').insert({
      event_id: eventId, first_name:form.first_name.trim(), last_name:form.last_name.trim(),
      email:form.email.trim()||null, phone:form.phone.trim()||null,
      guest_token:uuid(), qr_token:uuid(), status:'invited',
    })
    setSaving(false)
    if (error) { setMsg('Error: '+error.message); return }
    setMsg('Guest added!'); setTimeout(()=>{ onDone(); onClose() }, 700)
  }

  const importCSV = async () => {
    const lines = csv.trim().split('\n').filter(Boolean)
    if (!lines.length) return
    setSaving(true)
    const { v4: uuid } = await import('uuid')
    const start = lines[0].toLowerCase().includes('first_name') ? 1 : 0
    const rows = lines.slice(start).map(line => {
      const [fn='',ln='',em='',ph=''] = line.split(',').map(s=>s.trim().replace(/^"|"$/g,''))
      return { event_id:eventId, first_name:fn, last_name:ln, email:em||null, phone:ph||null, guest_token:uuid(), qr_token:uuid(), status:'invited' as const }
    }).filter(r=>r.first_name&&r.last_name)
    const { error } = await supabase.from('guests').insert(rows)
    setSaving(false)
    if (error) { setMsg('Error: '+error.message); return }
    setMsg(`${rows.length} guests imported!`); setTimeout(()=>{ onDone(); onClose() }, 900)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:T.white,borderRadius:4,padding:28,maxWidth:480,width:'100%',border:`1px solid ${T.n200}`,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <div style={{fontSize:17,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:700}}>Add Guests</div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:T.n400}}>✕</button>
        </div>
        <div style={{display:'flex',gap:0,borderBottom:`1px solid ${T.n200}`,marginBottom:18}}>
          {(['single','csv'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'8px 16px',background:'none',border:'none',borderBottom:`2px solid ${tab===t?T.n800:'transparent'}`,cursor:'pointer',fontSize:10,letterSpacing:'0.12em',fontFamily:'sans-serif',color:tab===t?T.n800:T.n400,fontWeight:tab===t?700:400,marginBottom:-1}}>
              {t==='single'?'SINGLE GUEST':'CSV IMPORT'}
            </button>
          ))}
        </div>
        {tab==='single'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {(['first_name','last_name'] as const).map(f=>(
                <div key={f}>
                  <label style={{display:'block',fontSize:9,letterSpacing:'0.18em',color:T.n400,fontFamily:'sans-serif',marginBottom:4}}>{f.replace('_',' ').toUpperCase()} *</label>
                  <input value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
                </div>
              ))}
            </div>
            {(['email','phone'] as const).map(f=>(
              <div key={f}>
                <label style={{display:'block',fontSize:9,letterSpacing:'0.18em',color:T.n400,fontFamily:'sans-serif',marginBottom:4}}>{f.toUpperCase()}</label>
                <input value={form[f]} onChange={e=>setForm(x=>({...x,[f]:e.target.value}))} style={{width:'100%',padding:'9px 11px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
            <button onClick={addSingle} disabled={saving||!form.first_name||!form.last_name}
              style={{padding:'11px',background:T.n800,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,letterSpacing:'0.15em',fontFamily:'sans-serif',fontWeight:700,marginTop:4}}>
              {saving?'ADDING…':'ADD GUEST'}
            </button>
          </div>
        )}
        {tab==='csv'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{fontSize:11,color:T.n600,fontFamily:'sans-serif',lineHeight:1.7,background:T.n100,padding:'10px 12px',borderRadius:3}}>
              Format: <code>first_name,last_name,email,phone</code><br/>One per line. Header optional.
            </div>
            <textarea value={csv} onChange={e=>setCsv(e.target.value)}
              placeholder={"Marco,Conti,m.conti@example.com,+39 02 123\nElena,Vasquez,e@example.com,"}
              rows={6} style={{width:'100%',padding:'9px 11px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:12,fontFamily:'monospace',color:T.n800,outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
            <button onClick={importCSV} disabled={saving||!csv.trim()}
              style={{padding:'11px',background:T.n800,color:T.white,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,letterSpacing:'0.15em',fontFamily:'sans-serif',fontWeight:700}}>
              {saving?'IMPORTING…':'IMPORT CSV'}
            </button>
          </div>
        )}
        {msg&&<div style={{marginTop:12,padding:'8px 12px',background:msg.startsWith('Error')?T.redBg:T.greenBg,border:`1px solid ${msg.startsWith('Error')?T.redBorder:T.greenBorder}`,borderRadius:3,fontSize:12,color:msg.startsWith('Error')?T.red:T.green,fontFamily:'sans-serif'}}>{msg}</div>}
      </div>
    </div>
  )
}

// ── Event Form Modal ──────────────────────────────────────────────────────────
function EventFormModal({ initial, onSave, onClose }: { initial?:XinaoEvent|null; onSave:(f:EventFormData)=>Promise<void>; onClose:()=>void }) {
  const blank: EventFormData = {name:'',subtitle:'',date:'',time:'',location:'',address:'',description:'',status:'upcoming',cover_image_url:null}
  const [form, setForm] = useState<EventFormData>(initial?{name:initial.name,subtitle:initial.subtitle??'',date:initial.date,time:initial.time,location:initial.location,address:initial.address??'',description:initial.description??'',status:initial.status,cover_image_url:initial.cover_image_url}:blank)
  const [saving, setSaving] = useState(false)
  const set = (k:keyof EventFormData, v:string|null) => setForm(f=>({...f,[k]:v}))
  const valid = form.name && form.date && form.location

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}}>
      <div style={{background:T.white,borderRadius:4,padding:'28px 24px',maxWidth:520,width:'100%',border:`1px solid ${T.n200}`,maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:3}}>XINAO EVENTS</div>
            <div style={{fontSize:18,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:700}}>{initial?'Edit Event':'New Event'}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:T.n400}}>✕</button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {([['Event Name *','name'],['Subtitle / Edition','subtitle'],['Date *','date','24 JUNE 2026'],['Time *','time','8:00 PM'],['Venue / Location *','location'],['Full Address','address'],['Description / Tagline','description']] as [string,keyof EventFormData,string?][]).map(([label,key,ph])=>(
            <div key={key}>
              <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{label.toUpperCase()}</label>
              <input value={form[key] as string??''} placeholder={ph??''} onChange={e=>set(key,e.target.value)} style={{width:'100%',padding:'10px 13px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',background:T.white,boxSizing:'border-box'}}/>
            </div>
          ))}
          <div>
            <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>STATUS</label>
            <select value={form.status} onChange={e=>set('status',e.target.value)} style={{width:'100%',padding:'10px 13px',border:`1px solid ${T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,background:T.white}}>
              <option value="upcoming">Upcoming</option><option value="active">Active</option><option value="past">Past</option>
            </select>
          </div>
          <ImageUpload value={form.cover_image_url} onChange={v=>set('cover_image_url',v)} label="Invitation Template (JPG/PNG)"/>
        </div>
        <div style={{display:'flex',gap:10,marginTop:22,justifyContent:'flex-end',flexWrap:'wrap'}}>
          <button onClick={onClose} style={{padding:'10px 18px',background:'none',border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:11,fontFamily:'sans-serif',color:T.n600}}>CANCEL</button>
          <button onClick={async()=>{if(!valid)return;setSaving(true);await onSave(form);setSaving(false)}} disabled={!valid||saving}
            style={{padding:'10px 20px',background:valid&&!saving?T.n800:T.n300,color:valid&&!saving?T.white:T.n400,border:'none',borderRadius:2,cursor:valid&&!saving?'pointer':'not-allowed',fontSize:11,letterSpacing:'0.15em',fontFamily:'sans-serif',fontWeight:700}}>
            {saving?'SAVING…':initial?'SAVE CHANGES':'CREATE EVENT'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [auth,       setAuth]       = useState(false)
  const [pwd,        setPwd]        = useState('')
  const [pwdErr,     setPwdErr]     = useState(false)
  const [events,     setEvents]     = useState<XinaoEvent[]>([])
  const [counts,     setCounts]     = useState<Record<string,{total:number,reg:number,in:number}>>({})
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string|null>(null)
  const [formOpen,   setFormOpen]   = useState(false)
  const [editEvt,    setEditEvt]    = useState<XinaoEvent|null>(null)
  const [delEvt,     setDelEvt]     = useState<XinaoEvent|null>(null)
  const [addGuestEvt,setAddGuestEvt]= useState<string|null>(null)
  const [menuOpen,   setMenuOpen]   = useState<string|null>(null)
  const [sortKey,    setSortKey]    = useState<'name'|'date'|'status'>('name')
  const [sortDir,    setSortDir]    = useState<'asc'|'desc'>('asc')

  useEffect(()=>{
    if(typeof window!=='undefined'&&sessionStorage.getItem(SESSION_KEY)==='1') setAuth(true)
  },[])

  const loadEvents = useCallback(async()=>{
    setLoading(true); setError(null)
    try {
      const {data,error} = await supabase.from('events').select('*').order('created_at',{ascending:false})
      if(error) throw error
      setEvents(data??[])
      const {data:guests} = await supabase.from('guests').select('event_id,status')
      if(guests){
        const c:Record<string,{total:number,reg:number,in:number}> = {}
        for(const g of guests){
          if(!c[g.event_id]) c[g.event_id]={total:0,reg:0,in:0}
          c[g.event_id].total++
          if(g.status!=='invited') c[g.event_id].reg++
          if(g.status==='checked-in') c[g.event_id].in++
        }
        setCounts(c)
      }
    } catch(e:any){ setError(e.message) }
    setLoading(false)
  },[])

  useEffect(()=>{ if(auth) loadEvents() },[auth,loadEvents])

  const login=()=>{
    if(pwd===ADMIN_PWD){ sessionStorage.setItem(SESSION_KEY,'1'); setAuth(true) }
    else{ setPwdErr(true); setTimeout(()=>setPwdErr(false),2000) }
  }
  const logout=()=>{ sessionStorage.removeItem(SESSION_KEY); setAuth(false); setPwd('') }

  const toggleSort=(k:typeof sortKey)=>{ if(k===sortKey) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortKey(k);setSortDir('asc')} }
  const sorted=[...events].sort((a,b)=>{const av=(a[sortKey]??'').toLowerCase(),bv=(b[sortKey]??'').toLowerCase();return av<bv?(sortDir==='asc'?-1:1):av>bv?(sortDir==='asc'?1:-1):0})

  const saveEvent=async(form:EventFormData)=>{
    setError(null)
    try{
      let img=form.cover_image_url
      if(editEvt){
        if(img?.startsWith('data:')) img=await uploadImage(img,editEvt.id)
        const {error}=await supabase.from('events').update({...form,cover_image_url:img,updated_at:new Date().toISOString()}).eq('id',editEvt.id)
        if(error) throw error
      } else {
        const {data,error}=await supabase.from('events').insert({name:form.name,subtitle:form.subtitle||null,date:form.date,time:form.time,location:form.location,address:form.address||null,description:form.description||null,status:form.status,cover_image_url:null}).select().single()
        if(error) throw error
        if(img?.startsWith('data:')){img=await uploadImage(img,data.id);if(img) await supabase.from('events').update({cover_image_url:img}).eq('id',data.id)}
      }
      setFormOpen(false); setEditEvt(null); await loadEvents()
    } catch(e:any){ setError(e.message) }
  }

  // ── DELETE EVENT — fully wired ──
  const confirmDelete=async()=>{
    if(!delEvt) return
    setError(null)
    const {error}=await supabase.from('events').delete().eq('id',delEvt.id)
    if(error){ setError(error.message); return }
    setDelEvt(null); await loadEvents()
  }

  const dupEvent=async(evt:XinaoEvent)=>{
    const {error}=await supabase.from('events').insert({name:`${evt.name} (Copy)`,subtitle:evt.subtitle,date:evt.date,time:evt.time,location:evt.location,address:evt.address,description:evt.description,status:'upcoming',cover_image_url:evt.cover_image_url})
    if(error){ setError(error.message); return }
    await loadEvents()
  }

  // ── Login screen ──
  if(!auth) return(
    <div style={{minHeight:'100vh',background:T.black,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{width:'100%',maxWidth:340,textAlign:'center'}}>
        <div style={{fontSize:26,fontWeight:700,color:T.gold,fontFamily:"'Georgia',serif",letterSpacing:'0.1em',marginBottom:4}}>XINAO</div>
        <div style={{width:18,height:1,background:T.gold,margin:'0 auto 7px'}}/>
        <div style={{fontSize:9,letterSpacing:'0.3em',color:T.n600,fontFamily:'sans-serif',marginBottom:32}}>ADMIN DASHBOARD</div>
        <div style={{background:'#111',border:`1px solid ${pwdErr?'#9F0E10':'#1A1A1A'}`,borderRadius:4,padding:28}}>
          <div style={{fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:4,textAlign:'left'}}>PASSWORD</div>
          <input type="password" value={pwd} onChange={e=>{setPwd(e.target.value);setPwdErr(false)}} onKeyDown={e=>e.key==='Enter'&&login()}
            placeholder="Enter admin password"
            style={{width:'100%',padding:'11px 12px',background:'#0A0A0A',border:`1px solid ${pwdErr?'#9F0E10':'#2A2520'}`,borderRadius:2,color:T.white,fontSize:14,fontFamily:'sans-serif',outline:'none',boxSizing:'border-box',marginBottom:7}}/>
          {pwdErr&&<div style={{fontSize:11,color:'#E57E7E',fontFamily:'sans-serif',marginBottom:7,textAlign:'left'}}>Incorrect password.</div>}
          <button onClick={login} style={{width:'100%',padding:12,background:T.gold,color:T.black,border:'none',borderRadius:2,cursor:'pointer',fontSize:11,fontWeight:700,letterSpacing:'0.18em',fontFamily:'sans-serif',marginTop:4}}>SIGN IN</button>
        </div>
      </div>
    </div>
  )

  return(
    <div style={{fontFamily:"'Georgia',serif",background:T.n100,minHeight:'100vh'}}>
      <style>{`*{box-sizing:border-box}`}</style>
      {/* Topbar */}
      <div style={{background:T.black,borderBottom:'1px solid #1A1A1A',padding:'0 16px',position:'sticky',top:0,zIndex:200}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',height:46}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:14,fontWeight:700,color:T.gold,letterSpacing:'0.12em',fontFamily:"'Georgia',serif"}}>XINAO</span>
            <span style={{width:1,height:11,background:'#2A2520',display:'block'}}/>
            <span style={{fontSize:8,color:T.n600,letterSpacing:'0.22em',fontFamily:'sans-serif'}}>ADMIN DASHBOARD</span>
          </div>
          <button onClick={logout} style={{padding:'4px 11px',background:'none',border:'1px solid #2A2520',borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.14em',fontFamily:'sans-serif',color:T.n600}}>LOGOUT</button>
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'24px 16px'}}>
        {error&&<div style={{marginBottom:14,padding:'10px 14px',background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:3,fontSize:12,color:T.red,fontFamily:'sans-serif'}}>⚠ {error}</div>}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:22,gap:10,flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:4}}>ADMIN DASHBOARD</div>
            <div style={{fontSize:24,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800}}>Events</div>
            <div style={{fontSize:11,color:T.n400,fontFamily:'sans-serif',marginTop:2}}>{loading?'Loading…':`${events.length} event${events.length!==1?'s':''}`}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {(['name','date','status'] as const).map(k=>(
              <button key={k} onClick={()=>toggleSort(k)}
                style={{padding:'6px 10px',background:sortKey===k?T.n800:T.white,color:sortKey===k?T.white:T.n600,border:`1px solid ${sortKey===k?T.n800:T.n200}`,borderRadius:2,cursor:'pointer',fontSize:9,letterSpacing:'0.08em',fontFamily:'sans-serif',display:'flex',alignItems:'center',gap:3}}>
                {k.toUpperCase()} <span style={{fontSize:8}}>{sortKey===k?(sortDir==='asc'?'▲':'▼'):'↕'}</span>
              </button>
            ))}
            <button onClick={()=>{setEditEvt(null);setFormOpen(true)}}
              style={{padding:'9px 16px',background:T.n800,color:T.cream,border:'none',borderRadius:2,cursor:'pointer',fontSize:10,letterSpacing:'0.18em',fontFamily:'sans-serif',fontWeight:700}}>
              + NEW EVENT
            </button>
          </div>
        </div>

        {loading&&<div style={{textAlign:'center',padding:'40px',color:T.n400,fontFamily:'sans-serif',fontSize:13}}>Loading events…</div>}
        {!loading&&events.length===0&&<div style={{textAlign:'center',padding:'40px',color:T.n400,fontFamily:'sans-serif',fontSize:13,border:`1px dashed ${T.n200}`,borderRadius:4}}>No events yet.</div>}

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
          {sorted.map(evt=>{
            const c=counts[evt.id]??{total:0,reg:0,in:0}
            const pct=c.total?Math.round(c.reg/c.total*100):0
            return(
              <div key={evt.id} style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,overflow:'hidden',position:'relative'}}>
                {evt.cover_image_url&&<img src={evt.cover_image_url} alt="" style={{width:'100%',height:80,objectFit:'cover',display:'block'}}/>}
                <div style={{height:3,background:`linear-gradient(90deg,${T.gold} ${pct}%,${T.n200} ${pct}%)`}}/>
                <div style={{padding:'14px',cursor:'pointer'}} onClick={()=>router.push(`/admin/events/${evt.id}`)}>
                  <div style={{fontSize:8,letterSpacing:'0.25em',color:T.gold,fontFamily:'sans-serif',marginBottom:3}}>{evt.subtitle||'XINAO EVENT'}</div>
                  <div style={{fontSize:16,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,marginBottom:2}}>{evt.name}</div>
                  <div style={{fontSize:10,color:T.n400,fontFamily:'sans-serif',marginBottom:12}}>{evt.date} · {evt.location}</div>
                  <div style={{display:'flex',gap:14}}>
                    {[['INVITED',c.total],['REG.',c.reg],['IN',c.in]].map(([l,v])=>(
                      <div key={String(l)}><div style={{fontSize:7,letterSpacing:'0.18em',color:T.n400,fontFamily:'sans-serif'}}>{l}</div><div style={{fontSize:18,fontFamily:"'Georgia',serif",color:T.n800,fontWeight:700}}>{v}</div></div>
                    ))}
                  </div>
                </div>
                {/* ⋯ menu */}
                <div style={{position:'absolute',top:evt.cover_image_url?88:8,right:8}}>
                  <button onClick={e=>{e.stopPropagation();setMenuOpen(menuOpen===evt.id?null:evt.id)}}
                    style={{width:28,height:28,background:T.white,border:`1px solid ${T.n200}`,borderRadius:2,cursor:'pointer',fontSize:14,color:T.n400,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.07)'}}>
                    ⋯
                  </button>
                  {menuOpen===evt.id&&(
                    <div style={{position:'absolute',top:31,right:0,background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,boxShadow:'0 4px 20px rgba(0,0,0,0.1)',zIndex:100,minWidth:160,overflow:'hidden'}}>
                      <button onClick={()=>{setMenuOpen(null);setEditEvt(evt);setFormOpen(true)}} style={{display:'block',width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:`1px solid ${T.n100}`,cursor:'pointer',fontSize:12,fontFamily:'sans-serif',color:T.n800,textAlign:'left'}}>✎  Edit</button>
                      <button onClick={()=>{setMenuOpen(null);setAddGuestEvt(evt.id)}} style={{display:'block',width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:`1px solid ${T.n100}`,cursor:'pointer',fontSize:12,fontFamily:'sans-serif',color:T.n800,textAlign:'left'}}>+ Add Guests</button>
                      <button onClick={()=>{setMenuOpen(null);dupEvent(evt)}} style={{display:'block',width:'100%',padding:'10px 14px',background:'none',border:'none',borderBottom:`1px solid ${T.n100}`,cursor:'pointer',fontSize:12,fontFamily:'sans-serif',color:T.n800,textAlign:'left'}}>⧉  Duplicate</button>
                      <button onClick={()=>{setMenuOpen(null);setDelEvt(evt)}} style={{display:'block',width:'100%',padding:'10px 14px',background:'none',border:'none',cursor:'pointer',fontSize:12,fontFamily:'sans-serif',color:T.red,textAlign:'left',fontWeight:700}}>✕  Delete Event</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {formOpen&&<EventFormModal initial={editEvt} onSave={saveEvent} onClose={()=>{setFormOpen(false);setEditEvt(null)}}/>}

      {/* DELETE CONFIRMATION */}
      {delEvt&&(
        <Modal
          title="Delete Event"
          message={`Delete "${delEvt.name}"? This removes all ${counts[delEvt.id]?.total??0} guests permanently. Cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={()=>setDelEvt(null)}
          danger
        />
      )}

      {addGuestEvt&&<AddGuestModal eventId={addGuestEvt} onDone={loadEvents} onClose={()=>setAddGuestEvt(null)}/>}
      {menuOpen&&<div style={{position:'fixed',inset:0,zIndex:99}} onClick={()=>setMenuOpen(null)}/>}
    </div>
  )
}
