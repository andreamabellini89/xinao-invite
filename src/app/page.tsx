'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Root redirects straight to admin — no landing page needed
export default function Home() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin') }, [])
  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:14, fontWeight:700, color:'#B8922A', fontFamily:"'Georgia',serif", letterSpacing:'0.1em' }}>XINAO</div>
    </div>
  )
}
