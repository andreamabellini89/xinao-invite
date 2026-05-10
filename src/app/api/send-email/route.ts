import { NextRequest, NextResponse } from 'next/server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao-invite.vercel.app'
// Change this to your verified Resend domain:
// e.g. 'XINAO Invite <noreply@andreamabellini.com>'
// or   'XINAO Events <noreply@xinao-events.com>'
const FROM = process.env.EMAIL_FROM ?? 'XINAO Invite <onboarding@resend.dev>'

export async function POST(req: NextRequest) {
  try {
    const { guest, event } = await req.json()

    if (!guest?.email)      return NextResponse.json({ error: 'Guest has no email address' }, { status: 400 })
    if (!guest?.first_name) return NextResponse.json({ error: 'Missing guest name' },         { status: 400 })
    if (!event?.name)       return NextResponse.json({ error: 'Missing event data' },          { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set in environment variables' }, { status: 500 })

    const inviteUrl = `${SITE}/invite/${event.id}/${guest.guest_token}`
    const guestName = `${guest.first_name} ${guest.last_name}`

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your XINAO Invitation</title></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Georgia',serif;">
  <div style="max-width:520px;margin:40px auto;background:#F8F5EF;border:1px solid #E0D8CC;">

    <div style="padding:44px 44px 32px;text-align:center;border-bottom:1px solid #E0D8CC;">
      <div style="font-size:28px;font-weight:700;color:#B8922A;letter-spacing:0.1em;">XINAO</div>
      <div style="width:28px;height:1px;background:#B8922A;margin:12px auto;"></div>
      <div style="font-size:10px;letter-spacing:0.38em;color:#5C5650;font-family:sans-serif;">PERSONAL INVITATION</div>
    </div>

    <div style="padding:40px 44px;text-align:center;">
      <div style="font-size:12px;letter-spacing:0.2em;color:#5C5650;font-family:sans-serif;margin-bottom:8px;">DEAR</div>
      <div style="font-size:22px;font-weight:700;color:#1A1008;letter-spacing:0.08em;margin-bottom:32px;">${guestName.toUpperCase()}</div>

      <div style="font-size:14px;color:#3A3028;line-height:1.8;margin-bottom:20px;">
        You have been personally invited to<br/>
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
        Please confirm your attendance to receive<br/>
        your personal invitation with unique QR code.
      </div>

      <a href="${inviteUrl}" style="display:inline-block;padding:16px 40px;background:#2A2520;color:#F5F0E8;text-decoration:none;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.24em;border-radius:2px;">
        CONFIRM ATTENDANCE →
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
        Please present your QR code upon arrival at ${event.location}.
      </div>
    </div>
  </div>
</body>
</html>`

    const text = `XINAO — PERSONAL INVITATION\n\nDear ${guestName},\n\nYou have been invited to ${event.name}${event.subtitle ? ` — ${event.subtitle}` : ''}.\n\n${event.date} at ${event.time}\n${event.location}\n${event.address ?? ''}\n\nConfirm your attendance:\n${inviteUrl}\n\nThis invitation is personal and non-transferable.\n\nThank you.`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to:   [guest.email],
        subject: `Your invitation — ${event.name}`,
        html,
        text,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', result)
      return NextResponse.json({
        error: result.message ?? 'Email send failed',
        hint: result.name === 'validation_error'
          ? 'Check that your FROM domain is verified in Resend dashboard.'
          : undefined,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: result.id })

  } catch (err: any) {
    console.error('send-email route error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}
