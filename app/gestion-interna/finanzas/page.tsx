'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Ingreso {
  id: number
  monto: number
  descripcion: string | null
  proyecto_id: number | null
  tipo_proyecto: string | null
  pago_desarrollador: number
  porcentaje_carlitos: number
  porcentaje_joaco: number
  porcentaje_hymperium: number
  fecha: string
}

interface Egreso {
  id: number
  monto: number
  descripcion: string
  categoria: string
  proyecto_id: number | null
  fecha: string
}

interface Categoria {
  id: number
  nombre: string
  porcentaje: number
  descripcion: string | null
  monto_asignado?: number
  monto_gastado?: number
  monto_disponible?: number
}

interface Billetera {
  total_ingresos: number
  total_egresos: number
  total_disponible: number
  categorias: Categoria[]
}

export default function FinanzasPage() {
  const [billetera, setBilletera] = useState<Billetera | null>(null)
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'billetera' | 'ingresos' | 'egresos' | 'categorias'>('billetera')
  const [showFormIngreso, setShowFormIngreso] = useState(false)
  const [showFormEgreso, setShowFormEgreso] = useState(false)
  const [showFormCategoria, setShowFormCategoria] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [billeteraRes, ingresosRes, egresosRes, categoriasRes] = await Promise.all([
        fetch('/api/finanzas/billetera'),
        fetch('/api/finanzas/ingresos'),
        fetch('/api/finanzas/egresos'),
        fetch('/api/finanzas/categorias'),
      ])

      setBilletera(await billeteraRes.json())
      setIngresos(await ingresosRes.json())
      setEgresos(await egresosRes.json())
      setCategorias(await categoriasRes.json())
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/gestion-interna" className="text-accent hover:underline text-sm mb-4 inline-block">
          ← Volver a Gestión Interna
        </Link>
        <h1 className="text-4xl font-semibold mb-2">Finanzas</h1>
        <p className="text-muted text-lg">Gestión de ingresos, egresos y billetera virtual</p>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        {[
          { id: 'billetera', label: 'Billetera Virtual' },
          { id: 'ingresos', label: 'Ingresos' },
          { id: 'egresos', label: 'Egresos' },
          { id: 'categorias', label: 'Categorías' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Cargando...</div>
      ) : (
        <>
          {activeTab === 'billetera' && (
            <BilleteraTab billetera={billetera} formatCurrency={formatCurrency} />
          )}
          {activeTab === 'ingresos' && (
            <IngresosTab
              ingresos={ingresos}
              formatCurrency={formatCurrency}
              showForm={showFormIngreso}
              setShowForm={setShowFormIngreso}
              onRefresh={fetchData}
            />
          )}
          {activeTab === 'egresos' && (
            <EgresosTab
              egresos={egresos}
              categorias={categorias}
              formatCurrency={formatCurrency}
              showForm={showFormEgreso}
              setShowForm={setShowFormEgreso}
              onRefresh={fetchData}
            />
          )}
          {activeTab === 'categorias' && (
            <CategoriasTab
              categorias={categorias}
              showForm={showFormCategoria}
              setShowForm={setShowFormCategoria}
              onRefresh={fetchData}
            />
          )}
        </>
      )}
    </div>
  )
}

function BilleteraTab({
  billetera,
  formatCurrency,
}: {
  billetera: Billetera | null
  formatCurrency: (amount: number) => string
}) {
  if (!billetera) {
    return <div className="text-muted">Cargando billetera...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-sm text-muted mb-2">Total Ingresos</h3>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(billetera.total_ingresos)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-sm text-muted mb-2">Total Egresos</h3>
          <p className="text-2xl font-semibold text-red-600">
            {formatCurrency(billetera.total_egresos)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-sm text-muted mb-2">Disponible</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(billetera.total_disponible)}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-6 border border-border">
        <h3 className="text-xl font-semibold mb-4">Categorías de Billetera</h3>
        {billetera.categorias.length === 0 ? (
          <p className="text-muted">No hay categorías configuradas</p>
        ) : (
          <div className="space-y-4">
            {billetera.categorias.map((cat) => (
              <div key={cat.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{cat.nombre}</h4>
                    {cat.descripcion && (
                      <p className="text-sm text-muted mt-1">{cat.descripcion}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium">{cat.porcentaje}%</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Asignado:</span>
                    <span>{formatCurrency(cat.monto_asignado || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Gastado:</span>
                    <span className="text-red-600">
                      {formatCurrency(cat.monto_gastado || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Disponible:</span>
                    <span className={cat.monto_disponible && cat.monto_disponible < 0 ? 'text-red-600' : ''}>
                      {formatCurrency(cat.monto_disponible || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function IngresosTab({
  ingresos,
  formatCurrency,
  showForm,
  setShowForm,
  onRefresh,
}: {
  ingresos: Ingreso[]
  formatCurrency: (amount: number) => string
  showForm: boolean
  setShowForm: (show: boolean) => void
  onRefresh: () => void
}) {
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    proyecto_id: '',
    tipo_proyecto: '',
    pago_desarrollador: '',
    porcentaje_carlitos: '',
    porcentaje_joaco: '',
    porcentaje_hymperium: '',
    fecha: new Date().toISOString().slice(0, 10),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/finanzas/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monto: parseFloat(formData.monto),
          proyecto_id: formData.proyecto_id ? parseInt(formData.proyecto_id) : null,
          pago_desarrollador: parseFloat(formData.pago_desarrollador) || 0,
          porcentaje_carlitos: parseFloat(formData.porcentaje_carlitos) || 0,
          porcentaje_joaco: parseFloat(formData.porcentaje_joaco) || 0,
          porcentaje_hymperium: parseFloat(formData.porcentaje_hymperium) || 0,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          monto: '',
          descripcion: '',
          proyecto_id: '',
          tipo_proyecto: '',
          pago_desarrollador: '',
          porcentaje_carlitos: '',
          porcentaje_joaco: '',
          porcentaje_hymperium: '',
          fecha: new Date().toISOString().slice(0, 10),
        })
        onRefresh()
      }
    } catch (error) {
      console.error('Error al crear ingreso:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Ingresos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Ingreso'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-surface-elevated rounded-lg border border-border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monto *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Descripción</label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ID Proyecto</label>
              <input
                type="number"
                value={formData.proyecto_id}
                onChange={(e) => setFormData({ ...formData, proyecto_id: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo Proyecto</label>
              <input
                type="text"
                value={formData.tipo_proyecto}
                onChange={(e) => setFormData({ ...formData, tipo_proyecto: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pago Desarrollador</label>
              <input
                type="number"
                step="0.01"
                value={formData.pago_desarrollador}
                onChange={(e) => setFormData({ ...formData, pago_desarrollador: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">% Carlitos</label>
              <input
                type="number"
                step="0.01"
                value={formData.porcentaje_carlitos}
                onChange={(e) => setFormData({ ...formData, porcentaje_carlitos: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">% Joaco</label>
              <input
                type="number"
                step="0.01"
                value={formData.porcentaje_joaco}
                onChange={(e) => setFormData({ ...formData, porcentaje_joaco: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">% Hymperium</label>
              <input
                type="number"
                step="0.01"
                value={formData.porcentaje_hymperium}
                onChange={(e) => setFormData({ ...formData, porcentaje_hymperium: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            Agregar Ingreso
          </button>
        </form>
      )}

      {ingresos.length === 0 ? (
        <p className="text-muted">No hay ingresos registrados</p>
      ) : (
        <div className="space-y-3">
          {ingresos.map((ingreso) => (
            <div key={ingreso.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{formatCurrency(ingreso.monto)}</p>
                  {ingreso.descripcion && (
                    <p className="text-sm text-muted mt-1">{ingreso.descripcion}</p>
                  )}
                </div>
                <span className="text-sm text-muted">
                  {new Date(ingreso.fecha).toLocaleDateString('es-ES')}
                </span>
              </div>
              {(ingreso.porcentaje_carlitos > 0 ||
                ingreso.porcentaje_joaco > 0 ||
                ingreso.porcentaje_hymperium > 0) && (
                <div className="text-xs text-muted mt-2">
                  Distribución: Carlitos {ingreso.porcentaje_carlitos}%, Joaco{' '}
                  {ingreso.porcentaje_joaco}%, Hymperium {ingreso.porcentaje_hymperium}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EgresosTab({
  egresos,
  categorias,
  formatCurrency,
  showForm,
  setShowForm,
  onRefresh,
}: {
  egresos: Egreso[]
  categorias: Categoria[]
  formatCurrency: (amount: number) => string
  showForm: boolean
  setShowForm: (show: boolean) => void
  onRefresh: () => void
}) {
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    proyecto_id: '',
    fecha: new Date().toISOString().slice(0, 10),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/finanzas/egresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monto: parseFloat(formData.monto),
          proyecto_id: formData.proyecto_id ? parseInt(formData.proyecto_id) : null,
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({
          monto: '',
          descripcion: '',
          categoria: '',
          proyecto_id: '',
          fecha: new Date().toISOString().slice(0, 10),
        })
        onRefresh()
      }
    } catch (error) {
      console.error('Error al crear egreso:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Egresos</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Egreso'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-surface-elevated rounded-lg border border-border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Monto *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoría *</label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              >
                <option value="">Seleccionar...</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Descripción *</label>
              <input
                type="text"
                required
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ID Proyecto</label>
              <input
                type="number"
                value={formData.proyecto_id}
                onChange={(e) => setFormData({ ...formData, proyecto_id: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha</label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            Agregar Egreso
          </button>
        </form>
      )}

      {egresos.length === 0 ? (
        <p className="text-muted">No hay egresos registrados</p>
      ) : (
        <div className="space-y-3">
          {egresos.map((egreso) => (
            <div key={egreso.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-red-600">{formatCurrency(egreso.monto)}</p>
                  <p className="text-sm text-muted mt-1">{egreso.descripcion}</p>
                  <p className="text-xs text-muted mt-1">Categoría: {egreso.categoria}</p>
                </div>
                <span className="text-sm text-muted">
                  {new Date(egreso.fecha).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoriasTab({
  categorias,
  showForm,
  setShowForm,
  onRefresh,
}: {
  categorias: Categoria[]
  showForm: boolean
  setShowForm: (show: boolean) => void
  onRefresh: () => void
}) {
  const [formData, setFormData] = useState({
    nombre: '',
    porcentaje: '',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/finanzas/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          porcentaje: parseFloat(formData.porcentaje),
        }),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ nombre: '', porcentaje: '', descripcion: '' })
        onRefresh()
      }
    } catch (error) {
      console.error('Error al crear categoría:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Categorías de Billetera</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Categoría'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-6 bg-surface-elevated rounded-lg border border-border space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Ej: Supervivencia, Servicios, Marketing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Porcentaje *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.porcentaje}
              onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              placeholder="Ej: 30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            Agregar Categoría
          </button>
        </form>
      )}

      {categorias.length === 0 ? (
        <p className="text-muted">No hay categorías configuradas</p>
      ) : (
        <div className="space-y-3">
          {categorias.map((cat) => (
            <div key={cat.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{cat.nombre}</h4>
                  {cat.descripcion && (
                    <p className="text-sm text-muted mt-1">{cat.descripcion}</p>
                  )}
                </div>
                <span className="text-sm font-medium">{cat.porcentaje}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
