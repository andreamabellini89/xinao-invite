'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { InvitationCard } from '@/components/InvitationCard'
import { THEME as T, uid } from '@/lib/utils'
import type { XinaoEvent, Guest } from '@/types'

const MOCK_EVENTS: XinaoEvent[] = [
  { id:'evt-001', name:'Threads of Connection', subtitle:'35th Anniversary', date:'24 JUNE 2026', time:'8:00 PM', location:'GIARDINO CORSINI', address:'VIA DELLA SCALA 115, FLORENCE, ITALY', description:'Art · Yarn · Nature · Contemporary Culture', status:'upcoming', cover_image_url:null, created_at:'', updated_at:'' },
  { id:'evt-002', name:'Native Soul Collection', subtitle:'Winter Preview 2026', date:'15 SEPTEMBER 2026', time:'7:30 PM', location:'PALAZZO STROZZI', address:'PIAZZA DEGLI STROZZI, FLORENCE, ITALY', description:'Cashmere · Heritage · Innovation', status:'upcoming', cover_image_url:null, created_at:'', updated_at:'' },
]
const MOCK_GUESTS: Guest[] = [
  { id:'g003', event_id:'evt-001', first_name:'James', last_name:'Richardson', email:'j.rich@sothebys.com', phone:null, status:'invited', guest_token:'tok-g7h8i9', qr_token:'qr-d7e8f9', registered_at:null, checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g004', event_id:'evt-001', first_name:'Elena', last_name:'Vasquez', email:'e.vasquez@hermes.fr', phone:null, status:'invited', guest_token:'tok-j1k2l3', qr_token:'qr-g1h2i3', registered_at:null, checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g008', event_id:'evt-002', first_name:'Yuki', last_name:'Tanaka', email:'y.tanaka@isseymiyake.jp', phone:null, status:'invited', guest_token:'tok-v4w5x6', qr_token:'qr-s4t5u6', registered_at:null, checked_in_at:null, created_at:'', updated_at:'' },
  { id:'g001', event_id:'evt-001', first_name:'Marco', last_name:'Conti', email:'m.conti@luxfashion.it', phone:null, status:'registered', guest_token:'tok-a1b2c3', qr_token:'qr-x1y2z3', registered_at:'2026-05-10T14:32:00Z', checked_in_at:null, created_at:'', updated_at:'' },
]

interface FormState { firstName: string; lastName: string; email: string; phone: string; consent: boolean }
interface Errors { firstName?: string; lastName?: string; email?: string; consent?: string }

export default function GuestInvitePage() {
  const params = useParams()
  const eventId = params.eventId as string
  const guestToken = params.guestToken as string

  const event = MOCK_EVENTS.find(e => e.id === eventId)
  const existingGuest = MOCK_GUESTS.find(g => g.guest_token === guestToken && g.event_id === eventId)
  const alreadyDone = existingGuest?.status === 'registered' || existingGuest?.status === 'checked-in'

  const [step, setStep] = useState<'invalid'|'already'|'form'|'success'>(() => {
    if (!event || !guestToken) return 'invalid'
    if (alreadyDone) return 'already'
    return 'form'
  })
  const [form, setForm] = useState<FormState>({ firstName: existingGuest?.first_name??'', lastName: existingGuest?.last_name??'', email: existingGuest?.email??'', phone: existingGuest?.phone??'', consent: false })
  const [errors, setErrors] = useState<Errors>({})
  const [saved, setSaved] = useState<Guest | null>(alreadyDone ? existingGuest??null : null)

  const validate = (): boolean => {
    const e: Errors = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.consent) e.consent = 'Please accept to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = () => {
    if (!validate() || !event) return
    const g: Guest = { id:`g-${uid()}`, event_id:eventId, first_name:form.firstName.trim(), last_name:form.lastName.trim(), email:form.email.trim(), phone:form.phone.trim()||null, status:'registered', guest_token:guestToken, qr_token:`qr-${uid()}`, registered_at:new Date().toISOString(), checked_in_at:null, created_at:new Date().toISOString(), updated_at:new Date().toISOString() }
    // In production: call supabase registerGuest()
    setSaved(g)
    setStep('success')
  }

  if (step === 'invalid') return (
    <div style={{minHeight:'100vh',background:T.cream,display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{textAlign:'center',maxWidth:280}}>
        <div style={{fontSize:28,marginBottom:10,color:T.n400}}>✕</div>
        <div style={{fontSize:15,fontFamily:"'Georgia',serif",color:T.n800,marginBottom:6}}>Invitation Not Found</div>
        <div style={{fontSize:12,color:T.n400,fontFamily:'sans-serif',lineHeight:1.7}}>This link is invalid or expired. Please contact the event organiser.</div>
      </div>
    </div>
  )

  if (step === 'already' && saved && event) return (
    <div style={{minHeight:'100vh',background:T.cream,display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 16px'}}>
      <div style={{width:'100%',maxWidth:400,background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:4,padding:'12px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:16,color:T.gold}}>✓</span>
        <span style={{fontSize:11,color:T.gold,fontFamily:'sans-serif'}}>You are already registered for this event.</span>
      </div>
      <InvitationCard guest={saved} event={event} showDownload />
    </div>
  )

  if (step === 'success' && saved && event) return (
    <div style={{minHeight:'100vh',background:T.cream,display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 16px'}}>
      <div style={{width:'100%',maxWidth:400,background:T.greenBg,border:`1px solid ${T.greenBorder}`,borderRadius:4,padding:'12px 16px',marginBottom:18,display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:18,color:T.green}}>✓</span>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:T.green,letterSpacing:'0.12em',fontFamily:'sans-serif'}}>REGISTRATION CONFIRMED</div>
          <div style={{fontSize:11,color:T.green,fontFamily:'sans-serif',marginTop:1}}>Your invitation is ready below.</div>
        </div>
      </div>
      <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:14}}>YOUR PERSONAL INVITATION</div>
      <InvitationCard guest={saved} event={event} showDownload />
      <div style={{fontSize:10,color:T.n400,marginTop:10,fontFamily:'sans-serif',textAlign:'center'}}>Present this QR code at the entrance on {event.date}.</div>
    </div>
  )

  if (!event) return null

  return (
    <div style={{minHeight:'100vh',background:T.cream,display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 16px'}}>
      <div style={{width:'100%',maxWidth:400}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:20,fontWeight:700,color:T.gold,fontFamily:"'Georgia',serif",letterSpacing:'0.08em'}}>XINAO</div>
          <div style={{width:14,height:1,background:T.gold,margin:'7px auto'}}/>
          <div style={{fontSize:8,letterSpacing:'0.3em',color:T.n600,fontFamily:'sans-serif'}}>CONFIRM YOUR ATTENDANCE</div>
        </div>
        <div style={{background:T.white,border:`1px solid ${T.n200}`,borderRadius:4,padding:14,marginBottom:18,textAlign:'center'}}>
          <div style={{fontSize:14,fontFamily:"'Georgia',serif",fontWeight:700,color:T.n800,marginBottom:2}}>{event.name}</div>
          {event.subtitle&&<div style={{fontSize:9,color:T.gold,letterSpacing:'0.12em',fontFamily:'sans-serif',marginBottom:3}}>{event.subtitle}</div>}
          <div style={{fontSize:10,color:T.gold,fontFamily:'sans-serif',marginBottom:2}}>{event.date} · {event.time}</div>
          <div style={{fontSize:10,color:T.n600,fontFamily:'sans-serif'}}>{event.location}</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {([['First Name *','firstName'],['Last Name *','lastName']] as [string,keyof FormState][]).map(([l,f])=>(
              <div key={f}>
                <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:4}}>{l.toUpperCase()}</label>
                <input value={form[f] as string} onChange={e=>{setForm(x=>({...x,[f]:e.target.value}));setErrors(er=>({...er,[f]:undefined}))}}
                  style={{width:'100%',padding:'9px 11px',background:T.white,border:`1px solid ${errors[f as keyof Errors]?T.red:T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
                {errors[f as keyof Errors]&&<div style={{fontSize:10,color:T.red,marginTop:2,fontFamily:'sans-serif'}}>{errors[f as keyof Errors]}</div>}
              </div>
            ))}
          </div>
          {([['Email Address *','email','email'],['Phone (optional)','phone','tel']] as [string,keyof FormState,string][]).map(([l,f,t])=>(
            <div key={f}>
              <label style={{display:'block',fontSize:9,letterSpacing:'0.2em',color:T.n400,fontFamily:'sans-serif',marginBottom:4}}>{l.toUpperCase()}</label>
              <input type={t} value={form[f] as string} onChange={e=>{setForm(x=>({...x,[f]:e.target.value}));setErrors(er=>({...er,[f]:undefined}))}}
                style={{width:'100%',padding:'9px 11px',background:T.white,border:`1px solid ${errors[f as keyof Errors]?T.red:T.n200}`,borderRadius:2,fontSize:13,fontFamily:'sans-serif',color:T.n800,outline:'none',boxSizing:'border-box'}}/>
              {errors[f as keyof Errors]&&<div style={{fontSize:10,color:T.red,marginTop:2,fontFamily:'sans-serif'}}>{errors[f as keyof Errors]}</div>}
            </div>
          ))}
          <div style={{display:'flex',gap:9,alignItems:'flex-start'}}>
            <input type="checkbox" id="consent" checked={form.consent} onChange={e=>{setForm(f=>({...f,consent:e.target.checked}));setErrors(er=>({...er,consent:undefined}))}} style={{marginTop:3,flexShrink:0}}/>
            <div>
              <label htmlFor="consent" style={{fontSize:11,color:T.n600,fontFamily:'sans-serif',lineHeight:1.6,cursor:'pointer'}}>I consent to Xinao Group processing my data for event management purposes.</label>
              {errors.consent&&<div style={{fontSize:10,color:T.red,marginTop:2,fontFamily:'sans-serif'}}>{errors.consent}</div>}
            </div>
          </div>
          <button onClick={submit} style={{padding:'12px 0',background:T.n800,color:T.cream,border:'none',borderRadius:2,fontSize:10,letterSpacing:'0.22em',fontFamily:'sans-serif',fontWeight:700,cursor:'pointer'}}>
            CONFIRM & RECEIVE INVITATION
          </button>
        </div>
      </div>
    </div>
  )
}
