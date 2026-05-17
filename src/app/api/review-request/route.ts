import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SITE  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao-events.com'
const FROM  = process.env.EMAIL_FROM ?? 'XINAO Events <noreply@xinao-events.com>'

async function sendApprovalEmail(guest: any, event: any, inviteUrl: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const guestName = `${guest.first_name} ${guest.last_name}`.toUpperCase()

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Georgia',serif;">
  <div style="max-width:520px;margin:40px auto;background:#F8F5EF;border:1px solid #E0D8CC;">
    <div style="padding:44px 44px 32px;text-align:center;border-bottom:1px solid #E0D8CC;">
      <div style="font-size:28px;font-weight:700;color:#B8922A;letter-spacing:0.1em;">XINAO</div>
      <div style="width:28px;height:1px;background:#B8922A;margin:12px auto;"></div>
      <div style="font-size:10px;letter-spacing:0.38em;color:#5C5650;font-family:sans-serif;">YOUR REQUEST HAS BEEN APPROVED</div>
    </div>
    <div style="padding:40px 44px;text-align:center;">
      <div style="font-size:12px;letter-spacing:0.2em;color:#5C5650;font-family:sans-serif;margin-bottom:8px;">DEAR</div>
      <div style="font-size:22px;font-weight:700;color:#1A1008;letter-spacing:0.08em;margin-bottom:28px;">${guestName}</div>
      <div style="font-size:14px;color:#3A3028;line-height:1.8;margin-bottom:20px;">
        We are pleased to confirm your attendance at<br/>
        <strong style="color:#1A1008;font-size:18px;">${event.name}</strong>
        ${event.subtitle ? `<br/><span style="color:#B8922A;font-style:italic;">${event.subtitle}</span>` : ''}
      </div>
      <div style="width:28px;height:1px;background:#B8922A;margin:0 auto 24px;"></div>
      <div style="font-size:14px;color:#B8922A;font-weight:700;letter-spacing:0.2em;font-family:sans-serif;margin-bottom:8px;">
        ${event.date} — ${event.time}
      </div>
      <div style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#1A1008;font-family:sans-serif;margin-bottom:5px;">${event.location}</div>
      ${event.address ? `<div style="font-size:11px;color:#8A8078;font-family:sans-serif;">${event.address}</div>` : ''}
      <div style="width:28px;height:1px;background:#B8922A;margin:28px auto;"></div>
      <div style="font-size:14px;color:#3A3028;line-height:1.8;margin-bottom:32px;">
        Please click below to access your personal invitation<br/>and download your unique QR code for entry.
      </div>
      <a href="${inviteUrl}" style="display:inline-block;padding:16px 40px;background:#2A2520;color:#F5F0E8;text-decoration:none;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.24em;border-radius:2px;">
        VIEW MY INVITATION →
      </a>
      <div style="margin-top:24px;font-size:11px;color:#A09890;font-family:sans-serif;line-height:1.7;">
        Or copy this link:<br/>
        <a href="${inviteUrl}" style="color:#B8922A;word-break:break-all;">${inviteUrl}</a>
      </div>
    </div>
    <div style="padding:24px 44px;border-top:1px solid #E0D8CC;text-align:center;">
      <div style="font-size:10px;letter-spacing:0.45em;color:#B8922A;font-family:sans-serif;">THANK YOU</div>
      <div style="font-size:10px;color:#A09890;font-family:sans-serif;margin-top:10px;line-height:1.6;">
        This invitation is personal and non-transferable.<br/>
        Please present your QR code upon arrival.
      </div>
    </div>
  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: FROM,
      to: [guest.email],
      subject: `Your invitation is confirmed — ${event.name}`,
      html,
    }),
  })
  return res.ok
}

export async function POST(req: NextRequest) {
  try {
    const { requestId, action } = await req.json()

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // Get the request
    const { data: request, error: reqErr } = await supabase
      .from('registration_requests')
      .select('*, events(*)')
      .eq('id', requestId)
      .single()

    if (reqErr || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Request already reviewed' }, { status: 400 })
    }

    const event = request.events

    if (action === 'reject') {
      await supabase.from('registration_requests').update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
      }).eq('id', requestId)

      return NextResponse.json({ success: true, action: 'rejected' })
    }

    // APPROVE — create guest and send invitation
    const { v4: uuid } = await require('uuid')
    const guestToken = uuid()
    const qrToken    = uuid()

    const { data: guest, error: guestErr } = await supabase
      .from('guests')
      .insert({
        event_id:    event.id,
        first_name:  request.first_name,
        last_name:   request.last_name,
        email:       request.email,
        phone:       request.phone,
        guest_token: guestToken,
        qr_token:    qrToken,
        status:      'invited',
      })
      .select()
      .single()

    if (guestErr) throw guestErr

    // Update request as approved
    await supabase.from('registration_requests').update({
      status:      'approved',
      reviewed_at: new Date().toISOString(),
      guest_id:    guest.id,
    }).eq('id', requestId)

    // Send approval email
    const inviteUrl = `${SITE}/invite/${event.id}/${guestToken}`
    const emailSent = await sendApprovalEmail(guest, event, inviteUrl)

    return NextResponse.json({
      success: true,
      action: 'approved',
      guestId: guest.id,
      emailSent,
    })

  } catch (err: any) {
    console.error('review-request error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
