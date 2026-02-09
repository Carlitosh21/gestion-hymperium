'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirigir a la nueva ubicación de gestión de onboarding
    router.replace('/clientes/onboarding')
  }, [router])

  return (
    <div className="p-8">
      <div className="text-center py-12 text-muted">
        Redirigiendo a Gestión de Onboarding...
      </div>
    </div>
  )
}
