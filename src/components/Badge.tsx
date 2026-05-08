import { GuestStatus } from '@/types'
import { THEME as T } from '@/lib/utils'

const STATUS_MAP: Record<GuestStatus, { label: string; bg: string; color: string; border: string }> = {
  invited:      { label: 'INVITED',     bg: T.n100,    color: T.n600,  border: T.n300 },
  registered:   { label: 'REGISTERED',  bg: T.greenBg, color: T.green, border: T.greenBorder },
  'checked-in': { label: 'CHECKED IN',  bg: T.goldBg,  color: T.gold,  border: T.goldBorder },
}

export function Badge({ status }: { status: GuestStatus }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.invited
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
      padding: '3px 8px', background: s.bg, color: s.color,
      border: `1px solid ${s.border}`, borderRadius: 3,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'sans-serif',
    }}>
      {s.label}
    </span>
  )
}
