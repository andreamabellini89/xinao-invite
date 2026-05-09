'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { TopBar } from '@/components/TopBar'
import { InvitationCard } from '@/components/InvitationCard'
import { THEME as T } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import type { XinaoEvent, Guest } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface FormState { firstName:string; lastName:string; email:string; phone:string; consent:boolean }
interface Errors    { firstName?:string; lastName?:string; email?:string; consent?:string }

export default function GuestInvitePage() {
  const params     = useParams()
  const eventId    = params.eventId    as string
  const guestToken = params.guestToken as string

  const [event,       setEvent]       = useState<XinaoEvent|null>(null)
  const [loading,     setLoading]     = useState(true)
  const [step,        setStep]        = useState<'loading'|'invalid'|'already'|'form'|'success'>('loading')
  const [form,        setForm]        = useState<FormState>({ firstName:'', lastName:'', email:'', phone:'', consent:false })
  const [errors,      setErrors]      = useState<Errors>({})
  const [saved,       setSaved]       = useState<Guest|null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string|null>(null)
  const [emailSent,   setEmailSent]   = useState(false)

  // ── Load event + guest ──
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [{ data: evt }, { data: gst }] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).single(),
          supabase.from('guests').select('*').eq('guest_token', guestToken).eq('event_id', eventId).single(),
        ])
        if (!evt || !gst) { setStep('invalid'); setLoading(false); return }
        setEvent(evt)
        if (gst.status === 'registered' || gst.status === 'checked-in') {
          setSaved(gst); setStep('already')
        } else {
          setForm(f => ({ ...f, firstName:gst.first_name||'', lastName:gst.last_name||'', email:gst.email||'', phone:gst.phone||'' }))
          setStep('form')
        }
      } catch { setStep('invalid') }
      setLoading(false)
    }
    load()
  }, [eventId, guestToken])

  // ── Validate ──
  const validate = (): boolean => {
    const e: Errors = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.consent) e.consent = 'Please accept to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit registration + send email ──
  const submit = async () => {
    if (!validate() || !event) return
    setSubmitting(true); setSubmitError(null)
    try {
      const now = new Date().toISOString()

      // 1. Save registration to Supabase
      const { data, error } = await supabase
        .from('guests')
        .update({
          first_name:    form.firstName.trim(),
          last_name:     form.lastName.trim(),
          email:         form.email.trim(),
          phone:         form.phone.trim() || null,
          status:        'registered',
          registered_at: now,
          updated_at:    now,
        })
        .eq('guest_token', guestToken)
        .eq('event_id', eventId)
        .select()
        .single()

      if (error) throw error
      setSaved(data)

      // 2. Send confirmation email (non-blocking — don't fail registration if email fails)
      try {
        const emailRes = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest: data, event }),
        })
        if (emailRes.ok) setEmailSent(true)
      } catch (emailErr) {
        console.warn('Email send failed (non-critical):', emailErr)
        // Registration still succeeds even if email fails
      }

      setStep('success')
    } catch (e: any) {
      setSubmitError(e.message ?? 'Registration failed. Please try again.')
    }
    setSubmitting(false)
  }

  // ── Screens ──

  if (step === 'loading') return (
    <div style={{ minHeight:'100vh', background:T.cream, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:13, color:T.n400, fontFamily:'sans-serif', letterSpacing:'0.1em' }}>Loading invitation…</div>
    </div>
  )

  if (step === 'invalid') return (
    <div style={{ minHeight:'100vh', background:T.cream }}>
      <TopBar section="GUEST PORTAL" />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:24, gap:16 }}>
        <div style={{ fontSize:36, color:T.n400 }}>✕</div>
        <div style={{ fontSize:17, fontFamily:"'Georgia',serif", color:T.n800 }}>Invitation Not Found</div>
        <div style={{ fontSize:13, color:T.n400, fontFamily:'sans-serif', lineHeight:1.7, textAlign:'center', maxWidth:300 }}>
          This link is invalid or has expired. Please contact the event organiser.
        </div>
        <a href="/" style={{ marginTop:8, padding:'10px 22px', background:'none', border:`1px solid ${T.n200}`, borderRadius:2, color:T.n600, textDecoration:'none', fontSize:10, letterSpacing:'0.18em', fontFamily:'sans-serif' }}>
          ← BACK TO MENU
        </a>
      </div>
    </div>
  )

  if (step === 'already' && saved && event) return (
    <div style={{ minHeight:'100vh', background:T.cream }}>
      <TopBar section="GUEST PORTAL" />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 16px' }}>
        <div style={{ width:'100%', maxWidth:440, background:T.goldBg, border:`1px solid ${T.goldBorder}`, borderRadius:4, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16, color:T.gold }}>✓</span>
          <span style={{ fontSize:11, color:T.gold, fontFamily:'sans-serif' }}>You are already registered for this event.</span>
        </div>
        <InvitationCard guest={saved} event={event} showDownload />
        <div style={{ fontSize:11, color:T.n400, marginTop:12, fontFamily:'sans-serif', textAlign:'center' }}>
          Present this QR code at the entrance on {event.date}.
        </div>
        <a href="/" style={{ marginTop:20, color:T.n400, fontFamily:'sans-serif', fontSize:10, letterSpacing:'0.15em', textDecoration:'none' }}>← BACK TO MENU</a>
      </div>
    </div>
  )

  if (step === 'success' && saved && event) return (
    <div style={{ minHeight:'100vh', background:T.cream }}>
      <TopBar section="GUEST PORTAL" />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 16px' }}>

        {/* Success banner */}
        <div style={{ width:'100%', maxWidth:440, background:T.greenBg, border:`1px solid ${T.greenBorder}`, borderRadius:4, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20, color:T.green }}>✓</span>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:T.green, letterSpacing:'0.14em', fontFamily:'sans-serif' }}>REGISTRATION CONFIRMED</div>
            <div style={{ fontSize:11, color:T.green, fontFamily:'sans-serif', marginTop:2 }}>Your personal invitation is ready. Save or download it.</div>
          </div>
        </div>

        {/* Email sent notice */}
        {emailSent && (
          <div style={{ width:'100%', maxWidth:440, background:'#EAF1FB', border:'1px solid #A8C4E8', borderRadius:4, padding:'10px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:14, color:'#1E3A6E' }}>✉</span>
            <span style={{ fontSize:11, color:'#1E3A6E', fontFamily:'sans-serif' }}>
              Confirmation email sent to <strong>{saved.email}</strong>
            </span>
          </div>
        )}

        <div style={{ fontSize:9, letterSpacing:'0.3em', color:T.gold, fontFamily:'sans-serif', marginBottom:16 }}>YOUR PERSONAL INVITATION</div>
        <InvitationCard guest={saved} event={event} showDownload />
        <div style={{ fontSize:11, color:T.n400, marginTop:12, fontFamily:'sans-serif', textAlign:'center' }}>
          Present this QR code at the entrance on {event.date}.
        </div>
        <a href="/" style={{ marginTop:20, color:T.n400, fontFamily:'sans-serif', fontSize:10, letterSpacing:'0.15em', textDecoration:'none' }}>← BACK TO MENU</a>
      </div>
    </div>
  )

  // ── Registration form ──
  if (!event) return null

  const Field = ({ label, field, type='text' }: { label:string; field:keyof FormState; type?:string }) => (
    <div>
      <label style={{ display:'block', fontSize:9, letterSpacing:'0.2em', color:T.n400, fontFamily:'sans-serif', marginBottom:5 }}>{label.toUpperCase()}</label>
      <input
        type={type}
        value={form[field] as string}
        onChange={e => { setForm(f=>({...f,[field]:e.target.value})); setErrors(er=>({...er,[field]:undefined})) }}
        style={{ width:'100%', padding:'10px 12px', background:'#fff', border:`1px solid ${(errors as any)[field]?T.red:T.n200}`, borderRadius:2, fontSize:13, fontFamily:'sans-serif', color:T.n800, outline:'none', boxSizing:'border-box' }}
      />
      {(errors as any)[field] && <div style={{ fontSize:10, color:T.red, marginTop:3, fontFamily:'sans-serif' }}>{(errors as any)[field]}</div>}
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:T.cream }}>
      <TopBar section="GUEST PORTAL" />
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 16px' }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:22, fontWeight:700, color:T.gold, fontFamily:"'Georgia',serif", letterSpacing:'0.08em' }}>XINAO</div>
            <div style={{ width:16, height:1, background:T.gold, margin:'8px auto' }} />
            <div style={{ fontSize:8, letterSpacing:'0.3em', color:T.n600, fontFamily:'sans-serif' }}>CONFIRM YOUR ATTENDANCE</div>
          </div>

          {/* Event card */}
          <div style={{ background:'#fff', border:`1px solid ${T.n200}`, borderRadius:4, padding:16, marginBottom:20, textAlign:'center' }}>
            <div style={{ fontSize:15, fontFamily:"'Georgia',serif", fontWeight:700, color:T.n800, marginBottom:2 }}>{event.name}</div>
            {event.subtitle && <div style={{ fontSize:9, color:T.gold, letterSpacing:'0.14em', fontFamily:'sans-serif', marginBottom:4 }}>{event.subtitle}</div>}
            <div style={{ fontSize:11, color:T.gold, fontFamily:'sans-serif', marginBottom:2 }}>{event.date} · {event.time}</div>
            <div style={{ fontSize:11, color:T.n600, fontFamily:'sans-serif' }}>{event.location}</div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="First Name *" field="firstName" />
              <Field label="Last Name *"  field="lastName" />
            </div>
            <Field label="Email Address *" field="email" type="email" />
            <Field label="Phone (optional)" field="phone" type="tel" />

            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <input type="checkbox" id="consent" checked={form.consent}
                onChange={e => { setForm(f=>({...f,consent:e.target.checked})); setErrors(er=>({...er,consent:undefined})) }}
                style={{ marginTop:3, flexShrink:0 }} />
              <div>
                <label htmlFor="consent" style={{ fontSize:11, color:T.n600, fontFamily:'sans-serif', lineHeight:1.6, cursor:'pointer' }}>
                  I consent to Xinao Group processing my personal data for event management purposes.
                </label>
                {errors.consent && <div style={{ fontSize:10, color:T.red, marginTop:2, fontFamily:'sans-serif' }}>{errors.consent}</div>}
              </div>
            </div>

            {submitError && (
              <div style={{ padding:'9px 12px', background:T.redBg, border:`1px solid ${T.redBorder}`, borderRadius:3, fontSize:12, color:T.red, fontFamily:'sans-serif' }}>
                ⚠ {submitError}
              </div>
            )}

            <button onClick={submit} disabled={submitting}
              style={{ padding:'13px 0', background:submitting?T.n300:T.n800, color:submitting?T.n400:T.cream, border:'none', borderRadius:2, fontSize:10, letterSpacing:'0.24em', fontFamily:'sans-serif', fontWeight:700, cursor:submitting?'not-allowed':'pointer', marginTop:4 }}>
              {submitting ? 'CONFIRMING…' : 'CONFIRM & RECEIVE INVITATION'}
            </button>

            <div style={{ textAlign:'center' }}>
              <a href="/" style={{ color:T.n400, fontFamily:'sans-serif', fontSize:10, letterSpacing:'0.15em', textDecoration:'none' }}>← BACK TO MENU</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
