import { Navigation } from '@/components/Navigation'
import { BrandingStyles } from '@/components/BrandingStyles'
import { redirect } from 'next/navigation'
import { hasAdmin, requireInternalSession } from '@/lib/auth'
import { getBranding } from '@/lib/config-store'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const branding = await getBranding()
    const title = branding.appTitle && branding.appSubtitle
      ? `${branding.appTitle} - ${branding.appSubtitle}`
      : 'Gestión Hymperium'
    return { title }
  } catch {
    return { title: 'Gestión Hymperium' }
  }
}

export default async function InternalLayout({
  children,
}: {
  children: ReactNode
}) {
  try {
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
  } catch (error) {
    // Si hay error (ej: tabla no existe), redirigir a setup para que corra migraciones
    console.error('Error en layout interno:', error)
    redirect('/setup')
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <BrandingStyles />
      <Navigation />
      <main className="flex-1 min-w-0 overflow-x-auto">
        {children}
      </main>
    </div>
  )
}
