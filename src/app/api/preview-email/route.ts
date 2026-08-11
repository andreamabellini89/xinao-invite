import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { EMAIL_COPY as DEFAULT_COPY, EVENT_AGENDA as DEFAULT_AGENDA } from '@/lib/email-config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
)
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://xinao-events.com'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('eventId')
  const guestId = searchParams.get('guestId')

  if (!eventId || !guestId) return new NextResponse('Missing params', { status: 400 })

  const [{ data: event }, { data: guest }] = await Promise.all([
    supabase.from('events').select('*').eq('id', eventId).single(),
    supabase.from('guests').select('*').eq('id', guestId).single(),
  ])

  if (!event || !guest) return new NextResponse('Not found', { status: 404 })

  const c = event.email_copy ?? {}
  const t = {
    invited_to_en:          c.invited_to_en          ?? DEFAULT_COPY.invited_to_en,
    invited_to_zh:          c.invited_to_zh          ?? DEFAULT_COPY.invited_to_zh,
    confirm_en:             c.confirm_en             ?? DEFAULT_COPY.confirm_en,
    confirm_zh:             c.confirm_zh             ?? DEFAULT_COPY.confirm_zh,
    dear_en:                c.dear_en                ?? DEFAULT_COPY.dear_en,
    dear_zh:                c.dear_zh                ?? DEFAULT_COPY.dear_zh,
    confirm_button_en:      c.confirm_button_en      ?? DEFAULT_COPY.confirm_button_en,
    confirm_button_zh:      c.confirm_button_zh      ?? DEFAULT_COPY.confirm_button_zh,
    copy_link_en:           c.copy_link_en           ?? DEFAULT_COPY.copy_link_en,
    copy_link_zh:           c.copy_link_zh           ?? DEFAULT_COPY.copy_link_zh,
    thank_you_en:           c.thank_you_en           ?? DEFAULT_COPY.thank_you_en,
    thank_you_zh:           c.thank_you_zh           ?? DEFAULT_COPY.thank_you_zh,
    non_transferable_en:    c.non_transferable_en    ?? DEFAULT_COPY.non_transferable_en,
    non_transferable_zh:    c.non_transferable_zh    ?? DEFAULT_COPY.non_transferable_zh,
    present_qr_en:          c.present_qr_en          ?? DEFAULT_COPY.present_qr_en,
    present_qr_zh:          c.present_qr_zh          ?? DEFAULT_COPY.present_qr_zh,
    personal_invitation_en: c.personal_invitation_en ?? DEFAULT_COPY.personal_invitation_en,
    personal_invitation_zh: c.personal_invitation_zh ?? DEFAULT_COPY.personal_invitation_zh,
  }

  const agenda: { time: string; title_en: string; title_zh: string }[] =
    (event.agenda && event.agenda.length > 0) ? event.agenda : DEFAULT_AGENDA

  const inviteUrl = `${SITE}/invite/${event.id}/${guest.guest_token}`
  const guestName = `${guest.first_name} ${guest.last_name}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Preview</title></head>
<body style="margin:0;padding:0;background:#F0EBE3;font-family:'Georgia',serif;">
  <div style="max-width:520px;margin:40px auto;background:#F8F5EF;border:1px solid #E0D8CC;">

    <div style="padding:44px 44px 32px;text-align:center;border-bottom:1px solid #E0D8CC;">
      <img src="${SITE}/xinao-logo.svg" alt="XINAO" width="200" style="max-width:200px;display:block;margin:0 auto;" />
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

      ${event.show_datetime_block !== false ? `
      <div style="width:28px;height:1px;background:#B8922A;margin:0 auto 24px;"></div>
      <div style="font-size:14px;color:#B8922A;font-weight:700;letter-spacing:0.2em;font-family:sans-serif;margin-bottom:8px;">
        ${event.date}${event.time ? ` — ${event.time}` : ''}
      </div>
      <div style="font-size:13px;font-weight:700;letter-spacing:0.15em;color:#1A1008;font-family:sans-serif;margin-bottom:5px;">${event.location}</div>
      ${event.address ? `<div style="font-size:11px;color:#8A8078;font-family:sans-serif;">${event.address}</div>` : ''}
      <div style="width:28px;height:1px;background:#B8922A;margin:28px auto;"></div>
      ` : ''}

      ${agenda.length > 0 ? `
      <div style="width:28px;height:1px;background:#B8922A;margin:0 auto 24px;"></div>
      <div style="font-size:10px;letter-spacing:0.38em;color:#B8922A;font-family:sans-serif;margin-bottom:16px;">AGENDA / 议程</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-family:sans-serif;">
        ${agenda.map(item => `
        <tr>
          <td style="padding:6px 12px 6px 0;font-size:12px;color:#B8922A;font-weight:700;white-space:nowrap;vertical-align:top;text-align:center;">${item.time}</td>
          <td style="padding:6px 0;font-size:13px;color:#1A1008;text-align:left;">
            ${item.title_en}<br/>
            <span style="font-size:11px;color:#8A8078;">${item.title_zh}</span>
          </td>
        </tr>`).join('')}
      </table>` : ''}

      ${event.show_confirm_section !== false ? `
      <div style="font-size:14px;color:#3A3028;line-height:1.8;margin-bottom:32px;">
        ${t.confirm_en}<br/>
        <span style="font-size:12px;color:#8A8078;font-family:sans-serif;">${t.confirm_zh}</span>
      </div>

      <a href="${inviteUrl}" style="display:inline-block;padding:16px 40px;background:#2A2520;color:#F5F0E8;text-decoration:none;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.24em;border-radius:2px;">
        ${t.confirm_button_en}
      </a>
      <div style="margin-top:6px;font-size:11px;color:#8A8078;font-family:sans-serif;">${t.confirm_button_zh}</div>

      <div style="margin-top:24px;font-size:11px;color:#A09890;font-family:sans-serif;line-height:1.7;">
        ${t.copy_link_en}<br/>
        <span style="font-size:10px;color:#8A8078;">${t.copy_link_zh}</span><br/>
        <a href="${inviteUrl}" style="color:#B8922A;word-break:break-all;">${inviteUrl}</a>
      </div>
      ` : ''}
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

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
