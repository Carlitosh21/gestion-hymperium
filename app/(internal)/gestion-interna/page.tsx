import Link from 'next/link'

export default function GestionInternaPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-semibold mb-2">Gestión Interna</h1>
      <p className="text-muted text-lg mb-8">Configuración del sistema</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/gestion-interna/config"
          className="bg-surface rounded-xl p-6 border border-border hover:bg-surface-elevated transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Configuración</h2>
          <p className="text-muted text-sm">Configuración del sistema</p>
        </Link>
      </div>
    </div>
  )
}
