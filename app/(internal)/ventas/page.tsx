import Link from 'next/link'

export default function VentasPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-semibold mb-2">Ventas</h1>
      <p className="text-muted text-lg mb-8">Gestión de prospección, contenido y llamadas</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/ventas/prospeccion"
          className="bg-surface rounded-xl p-6 border border-border hover:bg-surface-elevated transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Prospección</h2>
          <p className="text-muted text-sm">Pipeline de Leads y procedimientos estandarizados</p>
        </Link>
        
        <Link
          href="/ventas/contenido"
          className="bg-surface rounded-xl p-6 border border-border hover:bg-surface-elevated transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Contenido</h2>
          <p className="text-muted text-sm">Ideas de contenido y videos</p>
        </Link>
        
        <Link
          href="/ventas/llamadas"
          className="bg-surface rounded-xl p-6 border border-border hover:bg-surface-elevated transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Llamadas</h2>
          <p className="text-muted text-sm">Gestión de llamadas y vinculación con leads</p>
        </Link>
      </div>
    </div>
  )
}
