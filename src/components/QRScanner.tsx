'use client'
import { useEffect, useRef, useState } from 'react'
import { THEME as T } from '@/lib/utils'

interface Props {
  onScan: (value: string) => void
  active: boolean
}

export function QRScanner({ onScan, active }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const streamRef  = useRef<MediaStream|null>(null)
  const rafRef     = useRef<number>(0)
  const [status, setStatus] = useState<'idle'|'starting'|'scanning'|'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('idle')
  }

  const startCamera = async () => {
    setStatus('starting')
    setErrMsg('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setStatus('scanning')
        scanLoop()
      }
    } catch (e: any) {
      setStatus('error')
      if (e.name === 'NotAllowedError') setErrMsg('Camera permission denied. Please allow camera access and try again.')
      else if (e.name === 'NotFoundError') setErrMsg('No camera found on this device.')
      else setErrMsg('Could not start camera: ' + e.message)
    }
  }

  const scanLoop = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) { rafRef.current = requestAnimationFrame(scanLoop); return }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Use jsQR via dynamic import
    import('jsqr').then(({ default: jsQR }) => {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      })
      if (code?.data) {
        // Found a QR code
        onScan(code.data)
        // Brief pause before next scan to avoid double-firing
        setTimeout(() => { rafRef.current = requestAnimationFrame(scanLoop) }, 1500)
      } else {
        rafRef.current = requestAnimationFrame(scanLoop)
      }
    })
  }

  useEffect(() => {
    if (active) startCamera()
    else stopCamera()
    return () => stopCamera()
  }, [active])

  return (
    <div style={{ position:'relative', width:'100%', aspectRatio:'1', background:'#111', borderRadius:4, overflow:'hidden' }}>
      {/* Video feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ width:'100%', height:'100%', objectFit:'cover', display: status==='scanning'?'block':'none' }}
      />
      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} style={{ display:'none' }}/>

      {/* Corner brackets */}
      {(['tl','tr','bl','br'] as const).map(pos => (
        <div key={pos} style={{
          position:'absolute',
          top:    pos.startsWith('t') ? 16 : 'auto',
          bottom: pos.startsWith('b') ? 16 : 'auto',
          left:   pos.endsWith('l')   ? 16 : 'auto',
          right:  pos.endsWith('r')   ? 16 : 'auto',
          width: 24, height: 24,
          borderTop:    pos.startsWith('t') ? `3px solid ${T.gold}` : 'none',
          borderBottom: pos.startsWith('b') ? `3px solid ${T.gold}` : 'none',
          borderLeft:   pos.endsWith('l')   ? `3px solid ${T.gold}` : 'none',
          borderRight:  pos.endsWith('r')   ? `3px solid ${T.gold}` : 'none',
          zIndex: 2,
        }}/>
      ))}

      {/* Scanning line animation */}
      {status === 'scanning' && (
        <div style={{
          position:'absolute', left:16, right:16, height:2,
          background:`linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
          animation:'scanline 2s ease-in-out infinite',
          zIndex:2,
        }}/>
      )}

      {/* Overlay states */}
      {status === 'idle' && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
          <div style={{ fontSize:40, color:'#1A1A1A' }}>⊟</div>
          <div style={{ fontSize:11, color:T.n600, fontFamily:'sans-serif', letterSpacing:'0.1em', textAlign:'center', padding:'0 20px' }}>
            TAP BELOW TO START CAMERA
          </div>
        </div>
      )}

      {status === 'starting' && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
          <div style={{ fontSize:28, color:T.gold, animation:'spin 1s linear infinite' }}>◎</div>
          <div style={{ fontSize:10, color:T.n400, fontFamily:'sans-serif', letterSpacing:'0.15em' }}>STARTING CAMERA…</div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:20 }}>
          <div style={{ fontSize:28, color:T.red }}>✕</div>
          <div style={{ fontSize:11, color:'#E57E7E', fontFamily:'sans-serif', textAlign:'center', lineHeight:1.6 }}>{errMsg}</div>
        </div>
      )}

      {status === 'scanning' && (
        <div style={{ position:'absolute', bottom:12, left:0, right:0, textAlign:'center', zIndex:2 }}>
          <span style={{ fontSize:9, color:T.gold, fontFamily:'sans-serif', letterSpacing:'0.2em', background:'rgba(0,0,0,0.5)', padding:'4px 10px', borderRadius:2 }}>
            POINT AT QR CODE
          </span>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 20%; }
          50%  { top: 80%; }
          100% { top: 20%; }
        }
      `}</style>
    </div>
  )
}
