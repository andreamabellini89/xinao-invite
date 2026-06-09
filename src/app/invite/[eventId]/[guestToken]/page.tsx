'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { InvitationCard } from '@/components/InvitationCard'
import { THEME as T } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import type { XinaoEvent, Guest } from '@/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key'
)

export default function GuestInvitePage() {
  const { eventId, guestToken } = useParams() as { eventId:string; guestToken:string }

  const [event,   setEvent]   = useState<XinaoEvent|null>(null)
  const [guest,   setGuest]   = useState<Guest|null>(null)
  const [step,    setStep]    = useState<'loading'|'invalid'|'ready'>('loading')
  const [isNew,   setIsNew]   = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data:evt }, { data:gst }] = await Promise.all([
          supabase.from('events').select('*').eq('id', eventId).single(),
          supabase.from('guests').select('*').eq('guest_token', guestToken).eq('event_id', eventId).single(),
        ])
        if (!evt || !gst) { setStep('invalid'); return }
        setEvent(evt)

        // If already registered/checked-in just show the QR
        if (gst.status === 'registered' || gst.status === 'checked-in') {
          setGuest(gst)
          setStep('ready')
          return
        }

        // First time: auto-register using data already in the system
        const now = new Date().toISOString()
        const { data: updated, error } = await supabase
          .from('guests')
          .update({ status: 'registered', registered_at: now, updated_at: now })
          .eq('guest_token', guestToken)
          .eq('event_id', eventId)
          .select()
          .single()

        if (error) throw error
        setGuest(updated)
        setIsNew(true)
        setStep('ready')

        // Send confirmation email with QR (non-blocking)
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guest: updated, event: evt }),
          })
        } catch {}

      } catch { setStep('invalid') }
    }
    load()
  }, [eventId, guestToken])

  const bg = T.cream

  if (step === 'loading') return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:13,color:T.n400,fontFamily:'sans-serif',letterSpacing:'0.1em'}}>Loading invitation…</div>
    </div>
  )

  if (step === 'invalid') return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,gap:16}}>
      <div style={{fontSize:36,color:T.n400}}>✕</div>
      <div style={{fontSize:18,fontFamily:"'Georgia',serif",color:T.n800,textAlign:'center'}}>Invitation Not Found</div>
      <div style={{fontSize:13,color:T.n400,fontFamily:'sans-serif',lineHeight:1.7,textAlign:'center',maxWidth:300}}>
        This link is invalid or has expired.<br/>Please contact the event organiser.
      </div>
    </div>
  )

  if (!guest || !event) return null

  return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column',alignItems:'center',padding:'28px 16px'}}>

      {/* Banner */}
      <div style={{width:'100%',maxWidth:500,borderRadius:4,padding:'13px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:10,
        background: isNew ? T.greenBg : T.goldBg,
        border: `1px solid ${isNew ? T.greenBorder : T.goldBorder}`}}>
        <span style={{fontSize:20,color:isNew?T.green:T.gold}}>✓</span>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.14em',fontFamily:'sans-serif',color:isNew?T.green:T.gold}}>
            {isNew ? 'ATTENDANCE CONFIRMED' : 'YOUR INVITATION'}
          </div>
          <div style={{fontSize:11,fontFamily:'sans-serif',marginTop:2,color:isNew?T.green:T.gold}}>
            {isNew ? 'Your QR code is below — save or screenshot it.' : 'Your invitation is below.'}
          </div>
        </div>
      </div>

      <div style={{fontSize:9,letterSpacing:'0.3em',color:T.gold,fontFamily:'sans-serif',marginBottom:16}}>YOUR PERSONAL INVITATION</div>
      <InvitationCard guest={guest} event={event} showDownload/>
      <div style={{fontSize:11,color:T.n400,marginTop:14,fontFamily:'sans-serif',textAlign:'center',maxWidth:400}}>
        Show this QR code at the entrance on <strong>{event.date}</strong>.<br/>
        You can also screenshot this page.
      </div>
    </div>
  )
}
