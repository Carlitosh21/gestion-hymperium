'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, Copy } from 'lucide-react'

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
  estado?: string
}

interface Egreso {
  id: number
  monto: number
  descripcion: string
  categoria: string
  proyecto_id: number | null
  fecha: string
  estado?: string
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

type EgresoEstado = 'pendiente' | 'completado'
type EgresoFormData = { monto: string; descripcion: string; categoria: string; proyecto_id: string; fecha: string; estado: EgresoEstado }

type IngresoEstado = 'pendiente' | 'completado'
type IngresoFormData = { monto: string; descripcion: string; proyecto_id: string; tipo_proyecto: string; pago_desarrollador: string; porcentaje_carlitos: string; porcentaje_joaco: string; porcentaje_hymperium: string; fecha: string; estado: IngresoEstado }

interface Billetera {
  total_ingresos: number
  total_ingresos_hymperium: number
  total_ingresos_pendientes?: number
  total_ingresos_hymperium_pendientes?: number
  total_egresos: number
  total_disponible: number
  total_disponible_hymperium: number
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
  const [sinPermiso, setSinPermiso] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setSinPermiso(false)
      const [billeteraRes, ingresosRes, egresosRes, categoriasRes] = await Promise.all([
        fetch('/api/finanzas/billetera'),
        fetch('/api/finanzas/ingresos'),
        fetch('/api/finanzas/egresos'),
        fetch('/api/finanzas/categorias'),
      ])

      if (billeteraRes.status === 403 || ingresosRes.status === 403) {
        setSinPermiso(true)
        setLoading(false)
        return
      }

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

      {sinPermiso && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-xl">
          <p className="font-medium">No tenés permiso para ver esta sección.</p>
          <Link href="/gestion-interna" className="text-accent hover:underline text-sm mt-2 inline-block">
            Volver a Gestión Interna
          </Link>
        </div>
      )}

      {!sinPermiso && (
        <>
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
                <BilleteraTab
                  billetera={billetera}
                  ingresos={ingresos}
                  egresos={egresos}
                  formatCurrency={formatCurrency}
                />
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
        </>
      )}
    </div>
  )
}

function BilleteraTab({
  billetera,
  ingresos,
  egresos,
  formatCurrency,
}: {
  billetera: Billetera | null
  ingresos: Ingreso[]
  egresos: Egreso[]
  formatCurrency: (amount: number) => string
}) {
  if (!billetera) {
    return <div className="text-muted">Cargando billetera...</div>
  }

  // Últimos movimientos: combinar ingresos (crédito) y egresos (débito) ordenados por fecha
  const movimientos = [
    ...ingresos.map((i) => ({
      id: `ing-${i.id}`,
      tipo: 'ingreso' as const,
      fecha: i.fecha,
      descripcion: i.descripcion || 'Ingreso',
      monto: ((i.monto - (i.pago_desarrollador || 0)) * ((i.porcentaje_hymperium || 0) / 100)),
    })),
    ...egresos.map((e) => ({
      id: `egr-${e.id}`,
      tipo: 'egreso' as const,
      fecha: e.fecha,
      descripcion: e.descripcion,
      monto: -e.monto,
    })),
  ]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-sm text-muted mb-2">Cuenta Hymperium — Saldo</h3>
          <p className="text-2xl font-semibold">
            {formatCurrency(billetera.total_disponible_hymperium)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-sm text-muted mb-2">Ingresos Hymperium</h3>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(billetera.total_ingresos_hymperium)}
          </p>
        </div>
        <div className="bg-surface rounded-xl p-6 border border-border">
          <h3 className="text-sm text-muted mb-2">Egresos</h3>
          <p className="text-2xl font-semibold text-red-600">
            {formatCurrency(billetera.total_egresos)}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-6 border border-border">
        <h3 className="text-xl font-semibold mb-4">Últimos movimientos</h3>
        {movimientos.length === 0 ? (
          <p className="text-muted">No hay movimientos</p>
        ) : (
          <div className="space-y-2">
            {movimientos.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center py-2 border-b border-border last:border-0"
              >
                <div>
                  <span className="font-medium">{m.descripcion}</span>
                  <span className="text-sm text-muted ml-2">
                    {new Date(m.fecha).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <span
                  className={
                    m.monto >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
                  }
                >
                  {m.monto >= 0 ? '+' : ''}
                  {formatCurrency(m.monto)}
                </span>
              </div>
            ))}
          </div>
        )}
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

const emptyIngresoForm: IngresoFormData = {
  monto: '',
  descripcion: '',
  proyecto_id: '',
  tipo_proyecto: '',
  pago_desarrollador: '',
  porcentaje_carlitos: '',
  porcentaje_joaco: '',
  porcentaje_hymperium: '',
  fecha: new Date().toISOString().slice(0, 10),
  estado: 'completado',
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
  const [editIngreso, setEditIngreso] = useState<Ingreso | null>(null)
  const [formData, setFormData] = useState<IngresoFormData>(emptyIngresoForm)
  const [duplicateIngreso, setDuplicateIngreso] = useState<Ingreso | null>(null)
  const [duplicateFecha, setDuplicateFecha] = useState('')
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  useEffect(() => {
    if (editIngreso) {
      setFormData({
        monto: String(editIngreso.monto),
        descripcion: editIngreso.descripcion || '',
        proyecto_id: editIngreso.proyecto_id ? String(editIngreso.proyecto_id) : '',
        tipo_proyecto: editIngreso.tipo_proyecto || '',
        pago_desarrollador: String(editIngreso.pago_desarrollador ?? 0),
        porcentaje_carlitos: String(editIngreso.porcentaje_carlitos ?? 0),
        porcentaje_joaco: String(editIngreso.porcentaje_joaco ?? 0),
        porcentaje_hymperium: String(editIngreso.porcentaje_hymperium ?? 0),
        fecha: editIngreso.fecha ? editIngreso.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
        estado: editIngreso.estado === 'pendiente' ? 'pendiente' : 'completado',
      })
    } else if (!showForm) {
      setFormData(emptyIngresoForm)
    }
  }, [editIngreso, showForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion || null,
        proyecto_id: formData.proyecto_id ? parseInt(formData.proyecto_id) : null,
        tipo_proyecto: formData.tipo_proyecto || null,
        pago_desarrollador: parseFloat(formData.pago_desarrollador) || 0,
        porcentaje_carlitos: parseFloat(formData.porcentaje_carlitos) || 0,
        porcentaje_joaco: parseFloat(formData.porcentaje_joaco) || 0,
        porcentaje_hymperium: parseFloat(formData.porcentaje_hymperium) || 0,
        fecha: formData.fecha || new Date().toISOString(),
        estado: formData.estado,
      }

      const url = editIngreso
        ? `/api/finanzas/ingresos/${editIngreso.id}`
        : '/api/finanzas/ingresos'
      const method = editIngreso ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowForm(false)
        setEditIngreso(null)
        setFormData(emptyIngresoForm)
        onRefresh()
      }
    } catch (error) {
      console.error('Error al guardar ingreso:', error)
    }
  }

  const handleDelete = async (ingreso: Ingreso) => {
    if (!confirm('¿Borrar este ingreso? Esta acción no se puede deshacer.')) return
    try {
      const response = await fetch(`/api/finanzas/ingresos/${ingreso.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al borrar ingreso')
      }
      setEditIngreso(null)
      setShowForm(false)
      onRefresh()
    } catch (error: any) {
      alert(error.message || 'Error al borrar ingreso')
    }
  }

  const openEdit = (ingreso: Ingreso) => {
    setEditIngreso(ingreso)
    setShowForm(true)
  }

  const openDuplicate = (ingreso: Ingreso) => {
    setDuplicateIngreso(ingreso)
    setDuplicateFecha(ingreso.fecha ? ingreso.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10))
    setDuplicateError(null)
  }

  const handleDuplicateConfirm = async () => {
    if (!duplicateIngreso) return
    const fechaOriginal = duplicateIngreso.fecha ? duplicateIngreso.fecha.slice(0, 10) : ''
    if (duplicateFecha === fechaOriginal) return

    setDuplicateError(null)
    try {
      const payload = {
        monto: duplicateIngreso.monto,
        descripcion: duplicateIngreso.descripcion || null,
        proyecto_id: duplicateIngreso.proyecto_id,
        tipo_proyecto: duplicateIngreso.tipo_proyecto || null,
        pago_desarrollador: duplicateIngreso.pago_desarrollador ?? 0,
        porcentaje_carlitos: duplicateIngreso.porcentaje_carlitos ?? 0,
        porcentaje_joaco: duplicateIngreso.porcentaje_joaco ?? 0,
        porcentaje_hymperium: duplicateIngreso.porcentaje_hymperium ?? 0,
        fecha: duplicateFecha || new Date().toISOString(),
        estado: duplicateIngreso.estado === 'pendiente' ? 'pendiente' : 'completado',
      }

      const response = await fetch('/api/finanzas/ingresos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setDuplicateIngreso(null)
        onRefresh()
      } else {
        const data = await response.json()
        setDuplicateError(data.error || 'Error al duplicar ingreso')
      }
    } catch (error: any) {
      console.error('Error al duplicar ingreso:', error)
      setDuplicateError(error.message || 'Error al duplicar ingreso')
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditIngreso(null)
    setFormData(emptyIngresoForm)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Ingresos</h3>
        <button
          onClick={() => (editIngreso ? cancelForm() : setShowForm(!showForm))}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Ingreso'}
        </button>
      </div>

      {(showForm || editIngreso) && (
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
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as IngresoEstado })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              >
                <option value="completado">Completado</option>
                <option value="pendiente">Pendiente</option>
              </select>
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
            {editIngreso ? 'Guardar cambios' : 'Agregar Ingreso'}
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
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      (ingreso.estado || 'completado') === 'pendiente'
                        ? 'bg-orange-500/20 text-orange-500'
                        : 'bg-emerald-500/20 text-emerald-500'
                    }`}
                  >
                    {(ingreso.estado || 'completado') === 'pendiente' ? 'Pendiente' : 'Completado'}
                  </span>
                  <span className="text-sm text-muted">
                    {new Date(ingreso.fecha).toLocaleDateString('es-ES')}
                  </span>
                  <button
                    onClick={() => openEdit(ingreso)}
                    className="p-1.5 hover:bg-surface rounded transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => openDuplicate(ingreso)}
                    className="p-1.5 hover:bg-surface rounded transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => handleDelete(ingreso)}
                    className="p-1.5 hover:bg-surface rounded transition-colors"
                    title="Borrar"
                  >
                    <Trash2 className="w-4 h-4 text-muted" />
                  </button>
                </div>
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

      {duplicateIngreso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Duplicar Ingreso</h2>
            <p className="text-sm text-muted mb-4">
              Cambiá la fecha del duplicado (debe ser distinta a la original).
            </p>
            {duplicateError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
                {duplicateError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Fecha *</label>
              <input
                type="date"
                value={duplicateFecha}
                onChange={(e) => setDuplicateFecha(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setDuplicateIngreso(null); setDuplicateError(null) }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDuplicateConfirm}
                disabled={
                  duplicateFecha === (duplicateIngreso.fecha ? duplicateIngreso.fecha.slice(0, 10) : '')
                }
                className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Duplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const emptyEgresoForm: EgresoFormData = {
  monto: '',
  descripcion: '',
  categoria: '',
  proyecto_id: '',
  fecha: new Date().toISOString().slice(0, 10),
  estado: 'completado',
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
  const [editEgreso, setEditEgreso] = useState<Egreso | null>(null)
  const [formData, setFormData] = useState<EgresoFormData>(emptyEgresoForm)

  useEffect(() => {
    if (editEgreso) {
      setFormData({
        monto: String(editEgreso.monto),
        descripcion: editEgreso.descripcion,
        categoria: editEgreso.categoria,
        proyecto_id: editEgreso.proyecto_id ? String(editEgreso.proyecto_id) : '',
        fecha: editEgreso.fecha ? editEgreso.fecha.slice(0, 10) : new Date().toISOString().slice(0, 10),
        estado: editEgreso.estado === 'pendiente' ? 'pendiente' : 'completado',
      })
    } else if (!showForm) {
      setFormData(emptyEgresoForm)
    }
  }, [editEgreso, showForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        proyecto_id: formData.proyecto_id ? parseInt(formData.proyecto_id) : null,
        fecha: formData.fecha || new Date().toISOString(),
        estado: formData.estado,
      }

      const url = editEgreso
        ? `/api/finanzas/egresos/${editEgreso.id}`
        : '/api/finanzas/egresos'
      const method = editEgreso ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowForm(false)
        setEditEgreso(null)
        setFormData(emptyEgresoForm)
        onRefresh()
      }
    } catch (error) {
      console.error('Error al guardar egreso:', error)
    }
  }

  const handleDelete = async (egreso: Egreso) => {
    if (!confirm('¿Borrar este egreso? Esta acción no se puede deshacer.')) return
    try {
      const response = await fetch(`/api/finanzas/egresos/${egreso.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al borrar egreso')
      }
      setEditEgreso(null)
      setShowForm(false)
      onRefresh()
    } catch (error: any) {
      alert(error.message || 'Error al borrar egreso')
    }
  }

  const openEdit = (egreso: Egreso) => {
    setEditEgreso(egreso)
    setShowForm(true)
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditEgreso(null)
    setFormData(emptyEgresoForm)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Egresos</h3>
        <button
          onClick={() => (editEgreso ? cancelForm() : setShowForm(!showForm))}
          className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Agregar Egreso'}
        </button>
      </div>

      {(showForm || editEgreso) && (
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
                {editEgreso &&
                  !categorias.some((c) => c.nombre === editEgreso.categoria) && (
                    <option value={editEgreso.categoria}>{editEgreso.categoria}</option>
                  )}
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
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as 'pendiente' | 'completado' })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
              >
                <option value="pendiente">Pendiente</option>
                <option value="completado">Completado</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            {editEgreso ? 'Guardar cambios' : 'Agregar Egreso'}
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
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                      (egreso.estado || 'completado') === 'pendiente'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {(egreso.estado || 'completado') === 'pendiente' ? 'Pendiente' : 'Completado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">
                    {new Date(egreso.fecha).toLocaleDateString('es-ES')}
                  </span>
                  <button
                    onClick={() => openEdit(egreso)}
                    className="p-1.5 hover:bg-surface rounded transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => handleDelete(egreso)}
                    className="p-1.5 hover:bg-surface rounded transition-colors"
                    title="Borrar"
                  >
                    <Trash2 className="w-4 h-4 text-muted" />
                  </button>
                </div>
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
  const [editCategory, setEditCategory] = useState<Categoria | null>(null)
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    porcentaje: '',
    descripcion: '',
  })
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    if (editCategory) {
      setEditFormData({
        nombre: editCategory.nombre,
        porcentaje: String(editCategory.porcentaje),
        descripcion: editCategory.descripcion || '',
      })
      setEditError(null)
    }
  }, [editCategory])

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
      } else {
        const data = await response.json()
        alert(data.error || 'Error al crear categoría')
      }
    } catch (error) {
      console.error('Error al crear categoría:', error)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCategory) return
    setEditError(null)
    try {
      const response = await fetch(`/api/finanzas/categorias/${editCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: editFormData.nombre.trim(),
          porcentaje: parseFloat(editFormData.porcentaje),
          descripcion: editFormData.descripcion.trim() || null,
        }),
      })

      if (response.ok) {
        setEditCategory(null)
        onRefresh()
      } else {
        const data = await response.json()
        setEditError(data.error || 'Error al actualizar categoría')
      }
    } catch (error) {
      console.error('Error al actualizar categoría:', error)
      setEditError('Error al actualizar categoría')
    }
  }

  const handleDelete = async (cat: Categoria) => {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return
    try {
      const response = await fetch(`/api/finanzas/categorias/${cat.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onRefresh()
      } else {
        const data = await response.json()
        alert(data.error || 'No se pudo eliminar la categoría')
      }
    } catch (error) {
      console.error('Error al eliminar categoría:', error)
      alert('Error al eliminar categoría')
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cat.porcentaje}%</span>
                  <button
                    onClick={() => setEditCategory(cat)}
                    className="p-1.5 hover:bg-surface rounded transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4 text-muted" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 hover:bg-surface rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-muted" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Editar Categoría</h2>
            {editError && (
              <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm">
                {editError}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editFormData.nombre}
                  onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Porcentaje *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editFormData.porcentaje}
                  onChange={(e) => setEditFormData({ ...editFormData, porcentaje: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <textarea
                  value={editFormData.descripcion}
                  onChange={(e) => setEditFormData({ ...editFormData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setEditCategory(null); setEditError(null) }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
