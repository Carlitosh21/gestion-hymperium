import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Gestión Hymperium',
  description: 'Sistema de gestión para Hymperium',
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
