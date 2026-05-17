'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { THEME as T } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Event {
  id: string
  name: string
  subtitle?: string | null
  date: string
  time: string
  location: string
  address?: string | null
  description?: string | null
  cover_image_url?: string | null
  event_number?: string | null
}

interface Form {
  firstName: string
  lastName: string
  email: string
  phone: string
  message: string
  consent: boolean
}

interface Errors {
  firstName?: string
  lastName?: string
  email?: string
  consent?: string
}

export default function RegistrationPage() {
  const params = useParams()
  const eventNumber = params.eventNumber as string

  const [event,      setEvent]      = useState<Event | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [step,       setStep]       = useState<'loading' | 'invalid' | 'closed' | 'form' | 'success'>('loading')
  const [form,       setForm]       = useState<Form>({ firstName: '', lastName: '', email: '', phone: '', message: '', consent: false })
  const [errors,     setErrors]     = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitErr,  setSubmitErr]  = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: evt } = await supabase
          .from('events')
          .select('*')
          .eq('event_number', eventNumber)
          .single()

        if (!evt) { setStep('invalid'); setLoading(false); return }
        if (evt.status === 'past') { setStep('closed'); setLoading(false); setEvent(evt); return }
        setEvent(evt)
        setStep('form')
      } catch {
        setStep('invalid')
      }
      setLoading(false)
    }
    load()
  }, [eventNumber])

  const validate = (): boolean => {
    const e: Errors = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim())  e.lastName  = 'Required'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    if (!form.consent) e.consent = 'Please accept to continue'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate() || !event) return
    setSubmitting(true); setSubmitErr(null)
    try {
      // Check for duplicate request
      const { data: existing } = await supabase
        .from('registration_requests')
        .select('id, status')
        .eq('event_id', event.id)
        .eq('email', form.email.trim().toLowerCase())
        .single()

      if (existing) {
        if (existing.status === 'approved') {
          setSubmitErr('You are already registered for this event.')
        } else if (existing.status === 'pending') {
          setSubmitErr('Your request is already pending review. We will contact you soon.')
        } else {
          setSubmitErr('A request with this email already exists for this event.')
        }
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('registration_requests').insert({
        event_id:   event.id,
        first_name: form.firstName.trim(),
        last_name:  form.lastName.trim(),
        email:      form.email.trim().toLowerCase(),
        phone:      form.phone.trim() || null,
        message:    form.message.trim() || null,
        status:     'pending',
      })

      if (error) throw error
      setStep('success')
    } catch (e: any) {
      setSubmitErr(e.message ?? 'Registration failed. Please try again.')
    }
    setSubmitting(false)
  }

  const inputStyle = (hasErr?: string): React.CSSProperties => ({
    width: '100%', padding: '11px 13px', background: '#fff',
    border: `1px solid ${hasErr ? T.red : T.n200}`, borderRadius: 2,
    fontSize: 14, fontFamily: 'sans-serif', color: T.n800,
    outline: 'none', boxSizing: 'border-box',
  })

  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 13, color: T.n400, fontFamily: 'sans-serif', letterSpacing: '0.1em' }}>Loading…</div>
    </div>
  )

  if (step === 'invalid') return (
    <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <div style={{ fontSize: 36, color: T.n400 }}>✕</div>
      <div style={{ fontSize: 18, fontFamily: "'Georgia',serif", color: T.n800 }}>Event Not Found</div>
      <div style={{ fontSize: 13, color: T.n400, fontFamily: 'sans-serif', textAlign: 'center', maxWidth: 300, lineHeight: 1.7 }}>
        This registration link is invalid or the event no longer exists.
      </div>
    </div>
  )

  if (step === 'closed' && event) return (
    <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <div style={{ fontSize: 36, color: T.n400 }}>⊡</div>
      <div style={{ fontSize: 18, fontFamily: "'Georgia',serif", color: T.n800 }}>Registration Closed</div>
      <div style={{ fontSize: 13, color: T.n400, fontFamily: 'sans-serif', textAlign: 'center', maxWidth: 300, lineHeight: 1.7 }}>
        Registration for <strong>{event.name}</strong> is no longer available.
      </div>
    </div>
  )

  if (step === 'success' && event) return (
    <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.gold, fontFamily: "'Georgia',serif", letterSpacing: '0.1em' }}>XINAO</div>
          <div style={{ width: 18, height: 1, background: T.gold, margin: '8px auto' }} />
        </div>

        {/* Success */}
        <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 4, padding: '24px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, color: T.green, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.green, letterSpacing: '0.14em', fontFamily: 'sans-serif', marginBottom: 8 }}>
            REQUEST RECEIVED
          </div>
          <div style={{ fontSize: 13, color: T.green, fontFamily: 'sans-serif', lineHeight: 1.8 }}>
            Thank you for your interest in <strong>{event.name}</strong>.<br/>
            Your request has been submitted and is pending review.<br/>
            If approved, you will receive a confirmation email with your personal QR code.
          </div>
        </div>

        {/* Event details */}
        <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 4, padding: 20, marginTop: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontFamily: "'Georgia',serif", fontWeight: 700, color: T.n800, marginBottom: 4 }}>{event.name}</div>
          {event.subtitle && <div style={{ fontSize: 10, color: T.gold, letterSpacing: '0.14em', fontFamily: 'sans-serif', marginBottom: 6 }}>{event.subtitle}</div>}
          <div style={{ fontSize: 13, color: T.gold, fontFamily: 'sans-serif', marginBottom: 2 }}>{event.date} · {event.time}</div>
          <div style={{ fontSize: 12, color: T.n600, fontFamily: 'sans-serif' }}>{event.location}</div>
        </div>
      </div>
    </div>
  )

  if (!event) return null

  return (
    <div style={{ minHeight: '100vh', background: T.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: T.gold, fontFamily: "'Georgia',serif", letterSpacing: '0.08em' }}>XINAO</div>
          <div style={{ width: 16, height: 1, background: T.gold, margin: '8px auto' }} />
          <div style={{ fontSize: 8, letterSpacing: '0.3em', color: T.n600, fontFamily: 'sans-serif' }}>REQUEST TO ATTEND</div>
        </div>

        {/* Event card */}
        <div style={{ background: '#fff', border: `1px solid ${T.n200}`, borderRadius: 4, padding: 18, marginBottom: 24, textAlign: 'center' }}>
          {event.cover_image_url && (
            <img src={event.cover_image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 3, marginBottom: 14, display: 'block' }} />
          )}
          <div style={{ fontSize: 16, fontFamily: "'Georgia',serif", fontWeight: 700, color: T.n800, marginBottom: 3 }}>{event.name}</div>
          {event.subtitle && <div style={{ fontSize: 10, color: T.gold, letterSpacing: '0.14em', fontFamily: 'sans-serif', marginBottom: 6 }}>{event.subtitle}</div>}
          <div style={{ fontSize: 13, color: T.gold, fontFamily: 'sans-serif', marginBottom: 3 }}>{event.date} · {event.time}</div>
          <div style={{ fontSize: 12, color: T.n600, fontFamily: 'sans-serif', marginBottom: event.address ? 2 : 0 }}>{event.location}</div>
          {event.address && <div style={{ fontSize: 11, color: T.n400, fontFamily: 'sans-serif' }}>{event.address}</div>}
          {event.description && <div style={{ fontSize: 11, color: T.gold, fontStyle: 'italic', marginTop: 8, fontFamily: "'Georgia',serif" }}>{event.description}</div>}
        </div>

        {/* Info banner */}
        <div style={{ background: T.goldBg, border: `1px solid ${T.goldBorder}`, borderRadius: 4, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, color: T.gold, flexShrink: 0 }}>ℹ</span>
          <div style={{ fontSize: 11, color: T.gold, fontFamily: 'sans-serif', lineHeight: 1.6 }}>
            This is a request to attend. Once reviewed and approved by our team, you will receive a confirmation email with your personal invitation and QR code.
          </div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([['First Name *', 'firstName'], ['Last Name *', 'lastName']] as [string, keyof Form][]).map(([l, f]) => (
              <div key={f}>
                <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', color: T.n400, fontFamily: 'sans-serif', marginBottom: 5 }}>{l.toUpperCase()}</label>
                <input
                  value={form[f] as string}
                  onChange={e => { setForm(x => ({ ...x, [f]: e.target.value })); setErrors(er => ({ ...er, [f]: undefined })) }}
                  style={inputStyle(errors[f as keyof Errors])}
                />
                {errors[f as keyof Errors] && <div style={{ fontSize: 10, color: T.red, marginTop: 3, fontFamily: 'sans-serif' }}>{errors[f as keyof Errors]}</div>}
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', color: T.n400, fontFamily: 'sans-serif', marginBottom: 5 }}>EMAIL ADDRESS *</label>
            <input type="email" value={form.email}
              onChange={e => { setForm(x => ({ ...x, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })) }}
              style={inputStyle(errors.email)} />
            {errors.email && <div style={{ fontSize: 10, color: T.red, marginTop: 3, fontFamily: 'sans-serif' }}>{errors.email}</div>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', color: T.n400, fontFamily: 'sans-serif', marginBottom: 5 }}>PHONE (OPTIONAL)</label>
            <input type="tel" value={form.phone} onChange={e => setForm(x => ({ ...x, phone: e.target.value }))} style={inputStyle()} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', color: T.n400, fontFamily: 'sans-serif', marginBottom: 5 }}>MESSAGE (OPTIONAL)</label>
            <textarea value={form.message} onChange={e => setForm(x => ({ ...x, message: e.target.value }))} rows={3}
              placeholder="Any additional information you'd like to share…"
              style={{ ...inputStyle(), resize: 'vertical' as const }} />
          </div>

          {/* Consent */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <input type="checkbox" id="consent" checked={form.consent}
              onChange={e => { setForm(f => ({ ...f, consent: e.target.checked })); setErrors(er => ({ ...er, consent: undefined })) }}
              style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, cursor: 'pointer' }} />
            <div>
              <label htmlFor="consent" style={{ fontSize: 11, color: T.n600, fontFamily: 'sans-serif', lineHeight: 1.6, cursor: 'pointer' }}>
                I consent to Xinao Group processing my personal data for event management purposes. My data will not be shared with third parties.
              </label>
              {errors.consent && <div style={{ fontSize: 10, color: T.red, marginTop: 3, fontFamily: 'sans-serif' }}>{errors.consent}</div>}
            </div>
          </div>

          {submitErr && (
            <div style={{ padding: '10px 13px', background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 3, fontSize: 12, color: T.red, fontFamily: 'sans-serif' }}>
              ⚠ {submitErr}
            </div>
          )}

          <button onClick={submit} disabled={submitting}
            style={{ padding: '14px 0', background: submitting ? T.n300 : T.n800, color: submitting ? T.n400 : T.cream, border: 'none', borderRadius: 2, fontSize: 11, letterSpacing: '0.24em', fontFamily: 'sans-serif', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {submitting ? 'SUBMITTING…' : 'SUBMIT REGISTRATION REQUEST'}
          </button>
        </div>
      </div>
    </div>
  )
}
