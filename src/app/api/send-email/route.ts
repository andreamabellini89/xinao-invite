import { NextRequest, NextResponse } from 'next/server'
import { EMAIL_COPY as DEFAULT_COPY, EVENT_AGENDA as DEFAULT_AGENDA } from '@/lib/email-config'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao-invite.vercel.app'
const FROM = process.env.EMAIL_FROM ?? 'XINAO Invite <onboarding@resend.dev>'

export async function POST(req: NextRequest) {
  try {
    const { guest, event } = await req.json()

    if (!guest?.email)      return NextResponse.json({ error: 'Guest has no email address' }, { status: 400 })
    if (!guest?.first_name) return NextResponse.json({ error: 'Missing guest name' },         { status: 400 })
    if (!event?.name)       return NextResponse.json({ error: 'Missing event data' },          { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set in environment variables' }, { status: 500 })

    // Use saved copy from event, fallback to defaults
    const c = event.email_copy ?? {}
    const t = {
      invited_to_en:       c.invited_to_en       ?? DEFAULT_COPY.invited_to_en,
      invited_to_zh:       c.invited_to_zh       ?? DEFAULT_COPY.invited_to_zh,
      confirm_en:          c.confirm_en          ?? DEFAULT_COPY.confirm_en,
      confirm_zh:          c.confirm_zh          ?? DEFAULT_COPY.confirm_zh,
      dear_en:             c.dear_en             ?? DEFAULT_COPY.dear_en,
      dear_zh:             c.dear_zh             ?? DEFAULT_COPY.dear_zh,
      confirm_button_en:   c.confirm_button_en   ?? DEFAULT_COPY.confirm_button_en,
      confirm_button_zh:   c.confirm_button_zh   ?? DEFAULT_COPY.confirm_button_zh,
      copy_link_en:        c.copy_link_en        ?? DEFAULT_COPY.copy_link_en,
      copy_link_zh:        c.copy_link_zh        ?? DEFAULT_COPY.copy_link_zh,
      thank_you_en:        c.thank_you_en        ?? DEFAULT_COPY.thank_you_en,
      thank_you_zh:        c.thank_you_zh        ?? DEFAULT_COPY.thank_you_zh,
      non_transferable_en: c.non_transferable_en ?? DEFAULT_COPY.non_transferable_en,
      non_transferable_zh: c.non_transferable_zh ?? DEFAULT_COPY.non_transferable_zh,
      present_qr_en:       c.present_qr_en       ?? DEFAULT_COPY.present_qr_en,
      present_qr_zh:       c.present_qr_zh       ?? DEFAULT_COPY.present_qr_zh,
      subject_en:          c.subject_en          ?? DEFAULT_COPY.subject_en,
      subject_zh:          c.subject_zh          ?? DEFAULT_COPY.subject_zh,
      personal_invitation_en: c.personal_invitation_en ?? DEFAULT_COPY.personal_invitation_en,
      personal_invitation_zh: c.personal_invitation_zh ?? DEFAULT_COPY.personal_invitation_zh,
    }

    const agenda: { time: string; title_en: string; title_zh: string }[] =
      (event.agenda && event.agenda.length > 0) ? event.agenda : DEFAULT_AGENDA

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
      <div style="font-size:10px;letter-spacing:0.38em;color:#5C5650;font-family:sans-serif;">${t.personal_invitation_en}</div>
      <div style="font-size:10px;letter-spacing:0.2em;color:#8A8078;font-family:sans-serif;margin-top:2px;">${t.personal_invitation_zh}</div>
    </div>

    <div style="padding:40px 44px;text-align:center;">
      <div style="font-size:12px;letter-spacing:0.2em;color:#5C5650;font-family:sans-serif;margin-bottom:2px;">${t.dear_en}</div>
      <div style="font-size:11px;color:#8A8078;font-family:sans-serif;margin-bottom:8px;">${t.dear_zh}</div>
      <div style="font-size:22px;font-weight:700;color:#1A1008;letter-spacing:0.08em;margin-bottom:32px;">${guestName.toUpperCase()}</div>

      <div style="font-size:14px;color:#3A3028;line-height:1.8;margin-bottom:20px;">
        ${t.invited_to_en}<br/>
        <span style="font-size:12px;color:#8A8078;font-family:sans-serif;">${t.invited_to_zh}</span><br/>
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
        ${t.confirm_en}<br/>
        <span style="font-size:12px;color:#8A8078;font-family:sans-serif;">${t.confirm_zh}</span>
      </div>

      ${agenda.length > 0 ? `
      <div style="width:28px;height:1px;background:#B8922A;margin:0 auto 24px;"></div>
      <div style="font-size:10px;letter-spacing:0.38em;color:#B8922A;font-family:sans-serif;margin-bottom:16px;">AGENDA / 议程</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-family:sans-serif;">
        ${agenda.map(item => `
        <tr>
          <td style="padding:6px 12px 6px 0;font-size:12px;color:#B8922A;font-weight:700;white-space:nowrap;vertical-align:top;">${item.time}</td>
          <td style="padding:6px 0;font-size:13px;color:#1A1008;text-align:left;">
            ${item.title_en}<br/>
            <span style="font-size:11px;color:#8A8078;">${item.title_zh}</span>
          </td>
        </tr>`).join('')}
      </table>` : ''}

      <a href="${inviteUrl}" style="display:inline-block;padding:16px 40px;background:#2A2520;color:#F5F0E8;text-decoration:none;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.24em;border-radius:2px;">
        ${t.confirm_button_en}
      </a>
      <div style="margin-top:6px;font-size:11px;color:#8A8078;font-family:sans-serif;">${t.confirm_button_zh}</div>

      <div style="margin-top:24px;font-size:11px;color:#A09890;font-family:sans-serif;line-height:1.7;">
        ${t.copy_link_en}<br/>
        <span style="font-size:10px;color:#8A8078;">${t.copy_link_zh}</span><br/>
        <a href="${inviteUrl}" style="color:#B8922A;word-break:break-all;">${inviteUrl}</a>
      </div>
    </div>

    <div style="padding:24px 44px;border-top:1px solid #E0D8CC;text-align:center;">
      <div style="font-size:10px;letter-spacing:0.45em;color:#B8922A;font-family:sans-serif;">${t.thank_you_en}</div>
      <div style="font-size:10px;color:#8A8078;font-family:sans-serif;margin-top:2px;">${t.thank_you_zh}</div>
      <div style="font-size:10px;color:#A09890;font-family:sans-serif;margin-top:10px;line-height:1.6;">
        ${t.non_transferable_en}<br/>
        <span style="color:#8A8078;">${t.non_transferable_zh}</span><br/>
        ${t.present_qr_en} ${event.location}.<br/>
        <span style="color:#8A8078;">${t.present_qr_zh} ${event.location}。</span>
      </div>
    </div>
  </div>
</body>
</html>`

    const text = `XINAO — PERSONAL INVITATION\n\n${t.dear_en} ${guestName},\n\n${t.invited_to_en} ${event.name}${event.subtitle ? ` — ${event.subtitle}` : ''}.\n\n${event.date} at ${event.time}\n${event.location}\n${event.address ?? ''}\n\n${t.confirm_en}\n\n${inviteUrl}\n\n${t.non_transferable_en}\n\n${t.thank_you_en}.`

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to:   [guest.email],
        reply_to: FROM,
        subject: `${t.subject_en} ${event.name} / ${t.subject_zh} ${event.name}`,
        html,
        text,
        headers: {
          'X-Mailer': 'XINAO Events Platform',
          'List-Unsubscribe': `<mailto:unsubscribe@xinao-events.com?subject=Unsubscribe>`,
          'Precedence': 'bulk',
        },
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
