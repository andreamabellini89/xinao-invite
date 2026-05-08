export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''

export const uid = () => Math.random().toString(36).substr(2, 9)

export const THEME = {
  black: '#0A0A0A',
  cream: '#F5F0E8',
  gold: '#B8922A',
  goldLight: '#D4A843',
  red: '#E51E21',
  white: '#FAFAF8',
  n100: '#F0EBE3',
  n200: '#DDD8CF',
  n300: '#C8C0B6',
  n400: '#A09890',
  n600: '#5C5650',
  n800: '#2A2520',
  green: '#1E5C1E',
  greenBg: '#EDF7ED',
  greenBorder: '#A8CFA8',
  goldBg: '#FBF5E8',
  goldBorder: '#D4B870',
  redBg: '#FCEAEA',
  redBorder: '#E8A8A8',
} as const
