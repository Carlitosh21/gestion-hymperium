'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function hasAccess(required: string | string[], userPerms: string[]): boolean {
  if (userPerms.includes('*')) return true
  if (typeof required === 'string') return userPerms.includes(required)
  return required.some((p) => userPerms.includes(p))
}

export function RequirePermission({
  permission,
  fallbackHref = '/',
  children,
}: {
  permission: string | string[]
  fallbackHref?: string
  children: React.ReactNode
}) {
  const [access, setAccess] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        const perms = data?.user?.permissions || []
        setAccess(hasAccess(permission, perms))
      })
      .catch(() => setAccess(false))
  }, [permission])

  if (access === null) {
    return (
      <div className="p-8 text-muted">Cargando...</div>
    )
  }

  if (!access) {
    return (
      <div className="p-8">
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-xl">
          <p className="font-medium">No tenés permiso para ver esta sección.</p>
          <Link href={fallbackHref} className="text-accent hover:underline text-sm mt-2 inline-block">
            Volver
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
