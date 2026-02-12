'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Target, Users, FileText, MessageCircle, ToggleLeft, Settings } from 'lucide-react'

const menuItems = [
  { href: '/', label: 'DashBoard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Target },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/ctas', label: "CTA's", icon: FileText },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/interruptor', label: 'Interruptor', icon: ToggleLeft },
  { href: '/gestion-interna', label: 'Gestión Interna', icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()
  const [branding, setBranding] = useState<{ appTitle: string; appSubtitle: string; logoDataUrl: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setBranding(data))
      .catch(() => {})
  }, [])

  const bestMatchHref = menuItems
    .filter((item) => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <aside className="w-64 glass border-r border-border min-h-screen p-6">
      <div className="mb-8">
        {branding?.logoDataUrl ? (
          <img src={branding.logoDataUrl} alt="" className="h-10 object-contain mb-2" />
        ) : null}
        <h2 className="text-xl font-semibold">{branding?.appTitle ?? 'Hymperium'}</h2>
        <p className="text-sm text-muted mt-1">{branding?.appSubtitle ?? 'Gestión'}</p>
      </div>
      
      <nav className="space-y-2">
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
    </aside>
  )
}
