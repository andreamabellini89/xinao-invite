import { THEME as T } from '@/lib/utils'

interface Props {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function Modal({ title, message, onConfirm, onCancel, danger }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: T.white, borderRadius: 4, padding: 28, maxWidth: 400, width: '100%', border: `1px solid ${T.n200}` }}>
        <div style={{ fontSize: 17, fontFamily: "'Georgia',serif", color: T.n800, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 13, fontFamily: 'sans-serif', color: T.n600, lineHeight: 1.7, marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', background: 'none', border: `1px solid ${T.n200}`, borderRadius: 2, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', fontFamily: 'sans-serif', color: T.n600 }}>CANCEL</button>
          <button onClick={onConfirm} style={{ padding: '9px 18px', background: danger ? T.red : T.n800, border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', fontFamily: 'sans-serif', color: T.white, fontWeight: 700 }}>
            {danger ? 'DELETE' : 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  )
}
