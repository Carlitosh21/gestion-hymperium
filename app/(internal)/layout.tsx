import { Navigation } from '@/components/Navigation'
import { redirect } from 'next/navigation'
import { hasAdmin, requireInternalSession } from '@/lib/auth'
import type { ReactNode } from 'react'

export default async function InternalLayout({
  children,
}: {
  children: ReactNode
}) {
  // Verificar si existe admin
  const adminExists = await hasAdmin()
  
  if (!adminExists) {
    redirect('/setup')
  }

  // Verificar sesión interna
  try {
    await requireInternalSession()
  } catch (error) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
