import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'XINAO Invite System',
  description: 'Event invitation management for XINAO',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
