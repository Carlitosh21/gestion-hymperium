import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sociedad AI Setter',
  description: 'Sistema de gestión Sociedad AI Setter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}
