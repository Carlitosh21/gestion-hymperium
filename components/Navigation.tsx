'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Briefcase, Users, BarChart3, TrendingUp, Settings } from 'lucide-react'

const menuItems = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/ventas', label: 'Ventas', icon: Briefcase },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { href: '/proyecciones', label: 'Proyecciones', icon: TrendingUp },
  { href: '/gestion-interna', label: 'Gestión Interna', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <aside className="w-64 glass border-r border-border min-h-screen p-6">
      <div className="mb-8">
        <h2 className="text-xl font-semibold">Hymperium</h2>
        <p className="text-sm text-muted mt-1">Gestión</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href))
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
    </aside>
  )
}
