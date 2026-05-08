'use client'
import { useRef } from 'react'
import { THEME as T } from '@/lib/utils'

interface Props {
  value: string | null
  onChange: (dataUrl: string | null) => void
  label?: string
}

export function ImageUpload({ value, onChange, label = 'Upload Template Image' }: Props) {
  const ref = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 9, letterSpacing: '0.2em', color: T.n400, fontFamily: 'sans-serif', marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      <div
        onClick={() => ref.current?.click()}
        style={{
          border: `1.5px dashed ${value ? T.goldBorder : T.n200}`, borderRadius: 4,
          padding: value ? 0 : '24px 16px', cursor: 'pointer', textAlign: 'center',
          background: value ? 'transparent' : T.n100, overflow: 'hidden', position: 'relative',
          minHeight: value ? 100 : 70, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = T.gold)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = value ? T.goldBorder : T.n200)}
      >
        {value ? (
          <>
            <img src={value} alt="template" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block', borderRadius: 3 }} />
            <div
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 2, padding: '2px 6px', color: T.white, fontSize: 10, cursor: 'pointer' }}
            >✕</div>
          </>
        ) : (
          <div>
            <div style={{ fontSize: 20, marginBottom: 5 }}>🖼</div>
            <div style={{ fontSize: 11, color: T.n600, fontFamily: 'sans-serif' }}>Click to upload JPG or PNG</div>
            <div style={{ fontSize: 10, color: T.n400, fontFamily: 'sans-serif', marginTop: 2 }}>Recommended: 1080×1920px portrait</div>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/jpg" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}
