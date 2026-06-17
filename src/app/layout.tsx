import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'XINAO Invite System',
  description: 'Event invitation management for XINAO',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  )
}
