import { NextRequest, NextResponse } from 'next/server'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao-invite.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const { guest, event } = await req.json()

    // Validate required fields
    if (!guest?.email || !guest?.first_name || !event?.name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    const inviteUrl = `${SITE}/invite/${event.id}/${guest.guest_token}`
    const guestName = `${guest.first_name} ${guest.last_name}`

    // HTML email — styled to match Xinao invitation aesthetic
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Your XINAO Invitation</title>
</head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Georgia',serif;">
  <div style="max-width:520px;margin:40px auto;background:#F8F5EF;border:1px solid #E0D8CC;">

    <!-- Header -->
    <div style="padding:40px 40px 28px;text-align:center;border-bottom:1px solid #E0D8CC;">
      <div style="font-size:26px;font-weight:700;color:#B8922A;letter-spacing:0.1em;">XINAO</div>
      <div style="width:24px;height:1px;background:#B8922A;margin:10px auto;"></div>
      <div style="font-size:9px;letter-spacing:0.35em;color:#5C5650;font-family:sans-serif;">PERSONAL INVITATION</div>
    </div>

    <!-- Body -->
    <div style="padding:36px 40px;text-align:center;">
      <div style="font-size:11px;letter-spacing:0.2em;color:#5C5650;font-family:sans-serif;margin-bottom:8px;">DEAR</div>
      <div style="font-size:20px;font-weight:700;color:#1A1008;letter-spacing:0.08em;margin-bottom:28px;">
        ${guestName.toUpperCase()}
      </div>

      <div style="font-size:13px;color:#3A3028;line-height:1.8;margin-bottom:24px;">
        You have been invited to<br/>
        <strong style="color:#1A1008;">${event.name}</strong>
        ${event.subtitle ? `<br/><span style="color:#B8922A;font-style:italic;">${event.subtitle}</span>` : ''}
      </div>

      <div style="width:24px;height:1px;background:#B8922A;margin:0 auto 20px;"></div>

      <div style="font-size:13px;color:#B8922A;font-weight:700;letter-spacing:0.18em;font-family:sans-serif;margin-bottom:6px;">
        ${event.date} — ${event.time}
      </div>
      <div style="font-size:12px;font-weight:700;letter-spacing:0.15em;color:#1A1008;font-family:sans-serif;margin-bottom:4px;">
        ${event.location}
      </div>
      ${event.address ? `<div style="font-size:11px;color:#8A8078;font-family:sans-serif;margin-bottom:4px;">${event.address}</div>` : ''}

      <div style="width:24px;height:1px;background:#B8922A;margin:24px auto;"></div>

      <div style="font-size:13px;color:#3A3028;line-height:1.8;margin-bottom:28px;">
        Please confirm your attendance and<br/>
        receive your personal invitation with QR code.
      </div>

      <!-- CTA Button -->
      <a href="${inviteUrl}"
        style="display:inline-block;padding:14px 36px;background:#2A2520;color:#F5F0E8;text-decoration:none;font-family:sans-serif;font-size:11px;font-weight:700;letter-spacing:0.22em;border-radius:2px;">
        CONFIRM ATTENDANCE →
      </a>

      <div style="margin-top:20px;font-size:10px;color:#A09890;font-family:sans-serif;line-height:1.6;">
        Or copy this link in your browser:<br/>
        <span style="color:#B8922A;word-break:break-all;">${inviteUrl}</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;border-top:1px solid #E0D8CC;text-align:center;">
      <div style="font-size:9px;letter-spacing:0.4em;color:#B8922A;font-family:sans-serif;">THANK YOU</div>
      <div style="font-size:10px;color:#A09890;font-family:sans-serif;margin-top:8px;line-height:1.6;">
        This invitation is personal and non-transferable.<br/>
        Please present your QR code upon arrival.
      </div>
    </div>

  </div>
</body>
</html>`

    // Plain text fallback
    const text = `
XINAO — PERSONAL INVITATION

Dear ${guestName},

You have been invited to ${event.name}${event.subtitle ? ` — ${event.subtitle}` : ''}.

${event.date} at ${event.time}
${event.location}
${event.address ?? ''}

Please confirm your attendance and receive your personal QR code:
${inviteUrl}

THANK YOU
This invitation is personal and non-transferable.
`

    // Send via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'XINAO Invite <onboarding@resend.dev>',  // change to your domain later
        to: [guest.email],
        subject: `Your invitation — ${event.name}`,
        html,
        text,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Resend error:', result)
      return NextResponse.json({ error: result.message ?? 'Email send failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: result.id })

  } catch (err: any) {
    console.error('Send email error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
