'use client'

import { useRouter } from 'next/navigation'
import { TrendingUp, Users, Phone, DollarSign, Video, BarChart3 } from 'lucide-react'

export default function EstadisticasPage() {
  const router = useRouter()

  const modules = [
    {
      id: 'ventas',
      title: 'Ventas',
      description: 'Prospección, Llamadas y Contenido',
      icon: TrendingUp,
      color: 'bg-blue-500',
      href: '/estadisticas/ventas',
      available: true,
    },
    {
      id: 'clientes',
      title: 'Clientes',
      description: 'Onboarding y gestión',
      icon: Users,
      color: 'bg-green-500',
      href: '#',
      available: false,
    },
    {
      id: 'finanzas',
      title: 'Finanzas',
      description: 'Ingresos, egresos y billetera',
      icon: DollarSign,
      color: 'bg-emerald-500',
      href: '#',
      available: false,
    },
    {
      id: 'contenido',
      title: 'Contenido',
      description: 'Ideas y videos',
      icon: Video,
      color: 'bg-purple-500',
      href: '#',
      available: false,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold mb-2">Estadísticas</h1>
        <p className="text-muted text-lg">Análisis y reportes del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = module.icon
          return (
            <div
              key={module.id}
              onClick={() => module.available && router.push(module.href)}
              className={`
                bg-surface rounded-xl p-6 border border-border
                transition-all cursor-pointer
                ${module.available 
                  ? 'hover:border-accent hover:shadow-lg hover:scale-[1.02]' 
                  : 'opacity-60 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${module.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {module.available && (
                  <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full font-medium">
                    Disponible
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2">{module.title}</h2>
              <p className="text-muted text-sm">{module.description}</p>
              {!module.available && (
                <p className="text-xs text-muted mt-3 italic">Próximamente</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
