'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { InvitationCard } from '@/components/InvitationCard'
import { THEME as T } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import type { XinaoEvent, Guest } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Form { firstName:string; lastName:string; email:string; phone:string; consent:boolean }
interface Err  { firstName?:string; lastName?:string; email?:string; consent?:string }

export default function GuestInvitePage() {
  const { eventId, guestToken } = useParams() as { eventId:string; guestToken:string }

  const [event,      setEvent]      = useState<XinaoEvent|null>(null)
  const [loading,    setLoading]    = useState(true)
  const [step,       setStep]       = useState<'loading'|'invalid'|'already'|'form'|'success'>('loading')
  const [form,       setForm]       = useState<Form>({ firstName:'', lastName:'', email:'', phone:'', consent:false })
  const [errors,     setErrors]     = useState<Err>({})
  const [saved,      setSaved]      = useState<Guest|null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitErr,  setSubmitErr]  = useState<string|null>(null)
  const [emailSent,  setEmailSent]  = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data:evt }, { data:gst }] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).single(),
          supabase.from('guests').select('*').eq('guest_token', guestToken).eq('event_id', eventId).single(),
        ])
        if (!evt || !gst) { setStep('invalid'); setLoading(false); return }
        setEvent(evt)
        if (gst.status==='registered'||gst.status==='checked-in') { setSaved(gst); setStep('already') }
        else {
          setForm(f=>({...f, firstName:gst.first_name||'', lastName:gst.last_name||'', email:gst.email||'', phone:gst.phone||''}))
          setStep('form')
        }
      } catch { setStep('invalid') }
      setLoading(false)
    }
    load()
  }, [eventId, guestToken])

  const validate = () => {
    const e: Err = {}
    if (!form.firstName.trim()) e.firstName='Required'
    if (!form.lastName.trim())  e.lastName='Required'
    if (!form.email.trim()||!/\S+@\S+\.\S+/.test(form.email)) e.email='Valid email required'
    if (!form.consent) e.consent='Please accept to continue'
    setErrors(e)
    return !Object.keys(e).length
  }

  const submit = async () => {
    if (!validate()||!event) return
    setSubmitting(true); setSubmitErr(null)
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase.from('guests')
        .update({ first_name:form.firstName.trim(), last_name:form.lastName.trim(), email:form.email.trim(), phone:form.phone.trim()||null, status:'registered', registered_at:now, updated_at:now })
        .eq('guest_token', guestToken).eq('event_id', eventId)
        .select().single()
      if (error) throw error
      setSaved(data)
      // Send confirmation email (non-blocking)
      try {
        const res = await fetch('/api/send-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({guest:data, event}) })
        if (res.ok) setEmailSent(true)
      } catch {}
      setStep('success')
    } catch (e:any) { setSubmitErr(e.message??'Registration failed.') }
    setSubmitting(false)
  }

  // ── Shared styles ──
  const bg = T.cream
  const inputStyle = (hasErr?: string): React.CSSProperties => ({
    width:'100%', padding:'11px 13px', background:'#fff',
    border:`1px solid ${hasErr?T.red:T.n200}`, borderRadius:2,
    fontSize:14, fontFamily:'sans-serif', color:T.n800,
    outline:'none', boxSizing:'border-box',
  })

  if (step==='loading') return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:13,color:T.n400,fontFamily:'sans-serif',letterSpacing:'0.1em'}}>Loading invitation…</div>
    </div>
  )

  if (step==='invalid') return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:16}}>
      <div style={{fontSize:36,color:T.n400}}>✕</div>
      <div style={{fontSize:18,fontFamily:"'Georgia',serif",color:T.n800,textAlign:'center'}}>Invitation Not Found</div>
      <div style={{fontSize:13,color:T.n400,fontFamily:'sans-serif',lineHeight:1.7,textAlign:'center',maxWidth:300}}>
        This link is invalid or has expired.<br/>Please contact the event organiser.
      </div>
    </div>
  )

  if ((step==='already'||step==='success') && saved && event) return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 16px'}}>
      {/* Banner */}
      <div style={{width:'100%',maxWidth:500,borderRadius:4,padding:'13px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:10,
        background: step==='success'?T.greenBg:T.goldBg,
        border: `1px solid ${step==='success'?T.greenBorder:T.goldBorder}`}}>
        <span style={{fontSize:20,color:step==='success'?T.green:T.gold}}>✓</span>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.14em',fontFamily:'sans-serif',color:step==='success'?T.green:T.gold}}>
            {step==='success'?'REGISTRATION CONFIRMED':'ALREADY REGISTERED'}
          </div>
          <div style={{fontSize:11,fontFamily:'sans-serif',marginTop:2,color:step==='success'?T.green:T.gold}}>
            {step==='success'?'Download your invitation below.':'Your invitation is below.'}
          </div>
        </div>
      </div>

      {/* Email sent notice */}
      {emailSent && step==='success' && (
        <div style={{width:'100%',maxWidth:500,background:'#EAF1FB',border:'1px solid #A8C4E8',borderRadius:4,padding:'10px 14px',marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:14,color:'#1E3A6E'}}>✉</span>
          <span style={{fontSize:11,color:'#1E3A6E',fontFamily:'sans-serif'}}>Confirmation email sent to <strong>{saved.email}</strong></span>
        </div>
      )}

      <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:16}}>YOUR PERSONAL INVITATION</div>
      <InvitationCard guest={saved} event={event} showDownload/>
      <div style={{fontSize:11,color:T.n400,marginTop:14,fontFamily:'sans-serif',textAlign:'center',maxWidth:400}}>
        Show this QR code at the entrance on <strong>{event.date}</strong>.<br/>
        You can also screenshot this page.
      </div>
    </div>
  )

  // ── Registration form ──
  if (!event) return null

  return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 16px'}}>
      <div style={{width:'100%',maxWidth:440}}>

        {/* Header */}
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:24,fontWeight:700,color:T.gold,fontFamily:"'Georgia',serif",letterSpacing:'0.08em'}}>XINAO</div>
          <div style={{width:18,height:1,background:T.gold,margin:'9px auto'}}/>
          <div style={{fontSize:9,letterSpacing:'0.3em',color:T.n600,fontFamily:'sans-serif'}}>CONFIRM YOUR ATTENDANCE</div>
        </div>

        {/* Event summary */}
        <div style={{background:'#fff',border:`1px solid ${T.n200}`,borderRadius:4,padding:18,marginBottom:24,textAlign:'center'}}>
          <div style={{fontSize:16,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,marginBottom:3}}>{event.name}</div>
          {event.subtitle&&<div style={{fontSize:10,color:T.gold,letterSpacing:'0.14em',fontFamily:'sans-serif',marginBottom:6}}>{event.subtitle}</div>}
          <div style={{fontSize:13,color:T.gold,fontFamily:'sans-serif',marginBottom:3}}>{event.date} · {event.time}</div>
          <div style={{fontSize:12,color:T.n600,fontFamily:'sans-serif'}}>{event.location}</div>
        </div>

        {/* Form */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {([['First Name *','firstName'],['Last Name *','lastName']] as [string,keyof Form][]).map(([l,f])=>(
              <div key={f}>
                <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{l.toUpperCase()}</label>
                <input value={form[f] as string} onChange={e=>{setForm(x=>({...x,[f]:e.target.value}));setErrors(er=>({...er,[f]:undefined}))}} style={inputStyle(errors[f as keyof Err])}/>
                {errors[f as keyof Err]&&<div style={{fontSize:10,color:T.red,marginTop:3,fontFamily:'sans-serif'}}>{errors[f as keyof Err]}</div>}
              </div>
            ))}
          </div>

          {([['Email Address *','email','email'],['Phone (optional)','phone','tel']] as [string,keyof Form,string][]).map(([l,f,t])=>(
            <div key={f}>
              <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:5}}>{l.toUpperCase()}</label>
              <input type={t} value={form[f] as string} onChange={e=>{setForm(x=>({...x,[f]:e.target.value}));setErrors(er=>({...er,[f]:undefined}))}} style={inputStyle(errors[f as keyof Err])}/>
              {errors[f as keyof Err]&&<div style={{fontSize:10,color:T.red,marginTop:3,fontFamily:'sans-serif'}}>{errors[f as keyof Err]}</div>}
            </div>
          ))}

          {/* Consent */}
          <div style={{display:'flex',gap:10,alignItems:'flex-start',padding:'4px 0'}}>
            <input type="checkbox" id="consent" checked={form.consent}
              onChange={e=>{setForm(f=>({...f,consent:e.target.checked}));setErrors(er=>({...er,consent:undefined}))}}
              style={{marginTop:3,flexShrink:0,width:16,height:16,cursor:'pointer'}}/>
            <div>
              <label htmlFor="consent" style={{fontSize:12,color:T.n600,fontFamily:'sans-serif',lineHeight:1.6,cursor:'pointer'}}>
                I consent to Xinao Group processing my personal data for event management. My data will not be shared with third parties.
              </label>
              {errors.consent&&<div style={{fontSize:10,color:T.red,marginTop:3,fontFamily:'sans-serif'}}>{errors.consent}</div>}
            </div>
          </div>

          {submitErr&&(
            <div style={{padding:'10px 13px',background:T.redBg,border:`1px solid ${T.redBorder}`,borderRadius:3,fontSize:12,color:T.red,fontFamily:'sans-serif'}}>
              ⚠ {submitErr}
            </div>
          )}

          <button onClick={submit} disabled={submitting}
            style={{padding:'15px 0',background:submitting?T.n300:T.n800,color:submitting?T.n400:T.cream,border:'none',borderRadius:2,fontSize:11,letterSpacing:'0.24em',fontFamily:'sans-serif',fontWeight:700,cursor:submitting?'not-allowed':'pointer',marginTop:4}}>
            {submitting?'CONFIRMING…':'CONFIRM & RECEIVE INVITATION'}
          </button>
        </div>
      </div>
    </div>
  )
}
