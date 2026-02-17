'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Phone, Users, BarChart3, TrendingUp, DollarSign, Layers, Settings, LogOut } from 'lucide-react'

const ALL_MENU_ITEMS = [
  { href: '/', label: 'Inicio', icon: Home, permissions: null as string[] | null },
  { href: '/ventas/llamadas', label: 'Llamadas', icon: Phone, permissions: ['ventas.read'] },
  { href: '/clientes', label: 'Clientes', icon: Users, permissions: ['clientes.read'] },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3, permissions: ['estadisticas.view'] },
  { href: '/proyecciones', label: 'Proyecciones', icon: TrendingUp, permissions: ['proyecciones.view'] },
  { href: '/gestion-interna/finanzas', label: 'Finanzas', icon: DollarSign, permissions: ['finanzas.read'] },
  { href: '/oferta-servicios', label: 'Oferta y Servicios', icon: Layers, permissions: ['oferta_servicios.read'] },
  { href: '/gestion-interna', label: 'Gestión Interna', icon: Settings, permissions: ['config.manage', 'users.manage', 'finanzas.read'] },
]

function canAccess(permissions: string[] | null, userPerms: string[]): boolean {
  if (!permissions || permissions.length === 0) return true
  if (userPerms.includes('*')) return true
  return permissions.some((p) => userPerms.includes(p))
}

export function Navigation() {
  const pathname = usePathname()
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        setPermissions(data?.user?.permissions || [])
      })
      .catch(() => setPermissions([]))
  }, [])

  const menuItems = ALL_MENU_ITEMS.filter((item) => canAccess(item.permissions, permissions))

  // Activar solo el item con el href más específico que matchea (evitar doble active)
  const bestMatchHref = menuItems
    .filter((item) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  const router = useRouter()

  return (
    <aside className="w-64 glass border-r border-border min-h-screen p-6 flex flex-col">
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Sociedad AI Setter</h2>
        <p className="text-sm text-muted mt-1">Gestión</p>
      </div>
      
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => {
          const isActive = item.href === bestMatchHref
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-2.5 rounded-lg
                transition-all duration-150
                ${
                  isActive
                    ? 'bg-accent text-white font-medium'
                    : 'text-foreground hover:bg-surface-elevated'
                }
              `}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-border">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/login')
            router.refresh()
          }}
          className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
        >
          <LogOut size={20} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
