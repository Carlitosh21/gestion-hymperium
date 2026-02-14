'use client'

import { useState, useEffect } from 'react'
import { RequirePermission } from '@/components/RequirePermission'
import {
  FileText,
  Layers,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  History,
  Search,
  X,
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const TABS = [
  { id: 'docs', label: 'Docs', icon: FileText },
  { id: 'ofertas', label: 'Ofertas', icon: Layers },
  { id: 'sops', label: 'SOPs', icon: ClipboardList },
] as const

type TabId = (typeof TABS)[number]['id']

interface Doc {
  id: number
  titulo: string
  contenido_json: object
  tags: string[]
  carpeta: string | null
  created_at: string
  updated_at: string
}

interface Oferta {
  id: number
  nombre: string
  resumen: string | null
  contenido_json: object
  modulos?: Array<{ id?: number; titulo: string; descripcion: string | null; orden: number }>
  hitos?: Array<{
    id?: number
    titulo: string
    descripcion: string | null
    dias_desde_inicio: number | null
    orden: number
  }>
}

interface Sop {
  id: number
  titulo: string
  objetivo: string | null
  contenido_json: object
  frecuencia: string | null
  owner: string | null
  pasos?: Array<{
    id?: number
    titulo: string
    descripcion: string | null
    checklist_json: string[]
    orden: number
  }>
}

function RichTextEditor({
  content,
  onChange,
  placeholder,
}: {
  content: object
  onChange: (json: object) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank' } }),
    ],
    content: content && Object.keys(content).length ? content : undefined,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[120px] p-4 focus:outline-none border border-border rounded-lg bg-background',
      },
    },
  })

  useEffect(() => {
    if (editor && content && JSON.stringify(content) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  return <EditorContent editor={editor} />
}

function OfertaServiciosPageContent() {
  const [activeTab, setActiveTab] = useState<TabId>('docs')
  const [docs, setDocs] = useState<Doc[]>([])
  const [ofertas, setOfertas] = useState<Oferta[]>([])
  const [sops, setSops] = useState<Sop[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null)
  const [selectedSop, setSelectedSop] = useState<Sop | null>(null)
  const [showHistorial, setShowHistorial] = useState(false)
  const [revisiones, setRevisiones] = useState<Array<{ id: number; version: number; created_at: string }>>([])

  const fetchDocs = () =>
    fetch(`/api/oferta-servicios/docs?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then(setDocs)
  const fetchOfertas = () =>
    fetch(`/api/oferta-servicios/ofertas?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then(setOfertas)
  const fetchSops = () =>
    fetch(`/api/oferta-servicios/sops?search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then(setSops)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchDocs(), fetchOfertas(), fetchSops()]).finally(() => setLoading(false))
  }, [activeTab, search])

  const refresh = () => {
    fetchDocs()
    fetchOfertas()
    fetchSops()
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-semibold mb-2">Oferta y Servicios</h1>
      <p className="text-muted text-lg mb-6">Docs útiles, catálogo de ofertas y SOPs</p>

      <div className="mb-6 flex gap-2 border-b border-border">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id)
                setSelectedDoc(null)
                setSelectedOferta(null)
                setSelectedSop(null)
              }}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="flex gap-6">
        <div className="w-80 flex-shrink-0">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm"
              />
            </div>
          </div>
          {loading ? (
            <div className="text-muted text-sm">Cargando...</div>
          ) : (
            <div className="space-y-2">
              {activeTab === 'docs' &&
                docs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDoc(d)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDoc?.id === d.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:bg-surface-elevated'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{d.titulo || 'Sin título'}</p>
                    {d.tags?.length > 0 && (
                      <p className="text-xs text-muted mt-1">
                        {d.tags.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              {activeTab === 'ofertas' &&
                ofertas.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOferta(o)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedOferta?.id === o.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:bg-surface-elevated'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{o.nombre || 'Sin nombre'}</p>
                  </button>
                ))}
              {activeTab === 'sops' &&
                sops.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSop(s)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedSop?.id === s.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:bg-surface-elevated'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{s.titulo || 'Sin título'}</p>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {activeTab === 'docs' && (
            <DocsPanel
              selected={selectedDoc}
              onSelect={setSelectedDoc}
              onRefresh={refresh}
              onShowHistorial={(id) => {
                fetch(`/api/oferta-servicios/revisiones?tipo=doc&id=${id}`)
                  .then((r) => r.json())
                  .then(setRevisiones)
                setShowHistorial(true)
              }}
            />
          )}
          {activeTab === 'ofertas' && (
            <OfertasPanel
              selected={selectedOferta}
              onSelect={setSelectedOferta}
              onRefresh={refresh}
              onShowHistorial={(id) => {
                fetch(`/api/oferta-servicios/revisiones?tipo=oferta&id=${id}`)
                  .then((r) => r.json())
                  .then(setRevisiones)
                setShowHistorial(true)
              }}
            />
          )}
          {activeTab === 'sops' && (
            <SopsPanel
              selected={selectedSop}
              onSelect={setSelectedSop}
              onRefresh={refresh}
              onShowHistorial={(id) => {
                fetch(`/api/oferta-servicios/revisiones?tipo=sop&id=${id}`)
                  .then((r) => r.json())
                  .then(setRevisiones)
                setShowHistorial(true)
              }}
            />
          )}
        </div>
      </div>

      {showHistorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 border border-border max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Historial de versiones</h2>
              <button
                onClick={() => setShowHistorial(false)}
                className="p-2 hover:bg-surface-elevated rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {revisiones.length === 0 ? (
                <p className="text-muted">No hay revisiones</p>
              ) : (
                revisiones.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center py-2 border-b border-border"
                  >
                    <span>Versión {r.version}</span>
                    <span className="text-sm text-muted">
                      {new Date(r.created_at).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OfertaServiciosPage() {
  return (
    <RequirePermission permission="oferta_servicios.read" fallbackHref="/">
      <OfertaServiciosPageContent />
    </RequirePermission>
  )
}

function DocsPanel({
  selected,
  onSelect,
  onRefresh,
  onShowHistorial,
}: {
  selected: Doc | null
  onSelect: (d: Doc | null) => void
  onRefresh: () => void
  onShowHistorial: (id: number) => void
}) {
  const [editing, setEditing] = useState<Doc | null>(null)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState<object>({})
  const [tags, setTags] = useState<string[]>([])
  const [carpeta, setCarpeta] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selected) {
      setEditing(selected)
      setTitulo(selected.titulo)
      setContenido(selected.contenido_json || {})
      setTags(selected.tags || [])
      setCarpeta(selected.carpeta || '')
    } else {
      setEditing(null)
      setTitulo('')
      setContenido({})
      setTags([])
      setCarpeta('')
    }
  }, [selected])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { titulo, contenido_json: contenido, tags, carpeta: carpeta || null }
      const url = editing
        ? `/api/oferta-servicios/docs/${editing.id}`
        : '/api/oferta-servicios/docs'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const doc = await res.json()
        onSelect(doc)
        onRefresh()
        if (!editing) setEditing(doc)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing || !confirm('¿Borrar este doc?')) return
    const res = await fetch(`/api/oferta-servicios/docs/${editing.id}`, { method: 'DELETE' })
    if (res.ok) {
      onSelect(null)
      onRefresh()
    }
  }

  const handleNew = () => {
    onSelect(null)
    setEditing(null)
    setTitulo('')
    setContenido({})
    setTags([])
    setCarpeta('')
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Docs</h2>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Carpeta</label>
          <input
            value={carpeta}
            onChange={(e) => setCarpeta(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            placeholder="Opcional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Tags (separados por coma)</label>
          <input
            value={tags.join(', ')}
            onChange={(e) =>
              setTags(
                e.target.value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
              )
            }
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Contenido</label>
          <RichTextEditor content={contenido} onChange={setContenido} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {editing && (
            <>
              <button
                onClick={() => onShowHistorial(editing.id)}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated"
              >
                <History className="w-4 h-4" />
                Historial
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Borrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function OfertasPanel({
  selected,
  onSelect,
  onRefresh,
  onShowHistorial,
}: {
  selected: Oferta | null
  onSelect: (o: Oferta | null) => void
  onRefresh: () => void
  onShowHistorial: (id: number) => void
}) {
  const [editing, setEditing] = useState<Oferta | null>(null)
  const [nombre, setNombre] = useState('')
  const [resumen, setResumen] = useState('')
  const [contenido, setContenido] = useState<object>({})
  const [modulos, setModulos] = useState<Array<{ titulo: string; descripcion: string; orden: number }>>([])
  const [hitos, setHitos] = useState<
    Array<{ titulo: string; descripcion: string; dias_desde_inicio: number | null; orden: number }>
  >([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selected) {
      setEditing(selected)
      setNombre(selected.nombre)
      setResumen(selected.resumen || '')
      setContenido(selected.contenido_json || {})
      setModulos(
        (selected.modulos || []).map((m) => ({
          titulo: m.titulo,
          descripcion: m.descripcion || '',
          orden: m.orden ?? 0,
        }))
      )
      setHitos(
        (selected.hitos || []).map((h) => ({
          titulo: h.titulo,
          descripcion: h.descripcion || '',
          dias_desde_inicio: h.dias_desde_inicio ?? null,
          orden: h.orden ?? 0,
        }))
      )
    } else {
      setEditing(null)
      setNombre('')
      setResumen('')
      setContenido({})
      setModulos([])
      setHitos([])
    }
  }, [selected])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        nombre,
        resumen: resumen || null,
        contenido_json: contenido,
        modulos: modulos.map((m, i) => ({ ...m, orden: i })),
        hitos: hitos.map((h, i) => ({ ...h, orden: i })),
      }
      const url = editing
        ? `/api/oferta-servicios/ofertas/${editing.id}`
        : '/api/oferta-servicios/ofertas'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const oferta = await res.json()
        onSelect(oferta)
        onRefresh()
        if (!editing) setEditing(oferta)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing || !confirm('¿Borrar esta oferta?')) return
    const res = await fetch(`/api/oferta-servicios/ofertas/${editing.id}`, { method: 'DELETE' })
    if (res.ok) {
      onSelect(null)
      onRefresh()
    }
  }

  const handleNew = () => {
    onSelect(null)
    setEditing(null)
    setNombre('')
    setResumen('')
    setContenido({})
    setModulos([])
    setHitos([])
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Ofertas</h2>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover text-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Nombre</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Resumen</label>
          <textarea
            value={resumen}
            onChange={(e) => setResumen(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Descripción detallada</label>
          <RichTextEditor content={contenido} onChange={setContenido} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Módulos/Características</label>
            <button
              onClick={() => setModulos([...modulos, { titulo: '', descripcion: '', orden: modulos.length }])}
              className="text-sm text-accent"
            >
              + Agregar
            </button>
          </div>
          <div className="space-y-2">
            {modulos.map((m, i) => (
              <div key={i} className="p-3 border border-border rounded-lg space-y-2">
                <input
                  placeholder="Título del módulo"
                  value={m.titulo}
                  onChange={(e) => {
                    const next = [...modulos]
                    next[i] = { ...next[i], titulo: e.target.value }
                    setModulos(next)
                  }}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
                <textarea
                  placeholder="Descripción"
                  value={m.descripcion}
                  onChange={(e) => {
                    const next = [...modulos]
                    next[i] = { ...next[i], descripcion: e.target.value }
                    setModulos(next)
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
                <button
                  onClick={() => setModulos(modulos.filter((_, j) => j !== i))}
                  className="text-xs text-red-500"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Hitos / Cronograma</label>
            <button
              onClick={() =>
                setHitos([...hitos, { titulo: '', descripcion: '', dias_desde_inicio: null, orden: hitos.length }])
              }
              className="text-sm text-accent"
            >
              + Agregar
            </button>
          </div>
          <div className="space-y-2">
            {hitos.map((h, i) => (
              <div key={i} className="p-3 border border-border rounded-lg space-y-2">
                <input
                  placeholder="Título del hito"
                  value={h.titulo}
                  onChange={(e) => {
                    const next = [...hitos]
                    next[i] = { ...next[i], titulo: e.target.value }
                    setHitos(next)
                  }}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
                <input
                  type="number"
                  placeholder="Días desde inicio"
                  value={h.dias_desde_inicio ?? ''}
                  onChange={(e) => {
                    const next = [...hitos]
                    next[i] = { ...next[i], dias_desde_inicio: e.target.value ? parseInt(e.target.value) : null }
                    setHitos(next)
                  }}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
                <textarea
                  placeholder="Descripción"
                  value={h.descripcion}
                  onChange={(e) => {
                    const next = [...hitos]
                    next[i] = { ...next[i], descripcion: e.target.value }
                    setHitos(next)
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
                <button
                  onClick={() => setHitos(hitos.filter((_, j) => j !== i))}
                  className="text-xs text-red-500"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {editing && (
            <>
              <button
                onClick={() => onShowHistorial(editing.id)}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated"
              >
                <History className="w-4 h-4" />
                Historial
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Borrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SopsPanel({
  selected,
  onSelect,
  onRefresh,
  onShowHistorial,
}: {
  selected: Sop | null
  onSelect: (s: Sop | null) => void
  onRefresh: () => void
  onShowHistorial: (id: number) => void
}) {
  const [editing, setEditing] = useState<Sop | null>(null)
  const [titulo, setTitulo] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [owner, setOwner] = useState('')
  const [pasos, setPasos] = useState<
    Array<{ titulo: string; descripcion: string; checklist: string[]; orden: number }>
  >([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selected) {
      setEditing(selected)
      setTitulo(selected.titulo)
      setObjetivo(selected.objetivo || '')
      setFrecuencia(selected.frecuencia || '')
      setOwner(selected.owner || '')
      setPasos(
        (selected.pasos || []).map((p) => ({
          titulo: p.titulo,
          descripcion: p.descripcion || '',
          checklist: Array.isArray(p.checklist_json) ? p.checklist_json : [],
          orden: p.orden ?? 0,
        }))
      )
    } else {
      setEditing(null)
      setTitulo('')
      setObjetivo('')
      setFrecuencia('')
      setOwner('')
      setPasos([])
    }
  }, [selected])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        titulo,
        objetivo: objetivo || null,
        frecuencia: frecuencia || null,
        owner: owner || null,
        pasos: pasos.map((p, i) => ({
          titulo: p.titulo,
          descripcion: p.descripcion || null,
          checklist_json: p.checklist,
          orden: i,
        })),
      }
      const url = editing
        ? `/api/oferta-servicios/sops/${editing.id}`
        : '/api/oferta-servicios/sops'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const sop = await res.json()
        onSelect(sop)
        onRefresh()
        if (!editing) setEditing(sop)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editing || !confirm('¿Borrar este SOP?')) return
    const res = await fetch(`/api/oferta-servicios/sops/${editing.id}`, { method: 'DELETE' })
    if (res.ok) {
      onSelect(null)
      onRefresh()
    }
  }

  const handleNew = () => {
    onSelect(null)
    setEditing(null)
    setTitulo('')
    setObjetivo('')
    setFrecuencia('')
    setOwner('')
    setPasos([])
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">SOPs</h2>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Objetivo</label>
          <textarea
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Frecuencia</label>
            <input
              value={frecuencia}
              onChange={(e) => setFrecuencia(e.target.value)}
              placeholder="ej: Semanal"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Responsable</label>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Owner"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Pasos</label>
            <button
              onClick={() =>
                setPasos([
                  ...pasos,
                  { titulo: '', descripcion: '', checklist: [], orden: pasos.length },
                ])
              }
              className="text-sm text-accent"
            >
              + Agregar paso
            </button>
          </div>
          <div className="space-y-4">
            {pasos.map((p, i) => (
              <div key={i} className="p-4 border border-border rounded-lg space-y-2">
                <input
                  placeholder={`Paso ${i + 1}: Título`}
                  value={p.titulo}
                  onChange={(e) => {
                    const next = [...pasos]
                    next[i] = { ...next[i], titulo: e.target.value }
                    setPasos(next)
                  }}
                  className="w-full px-3 py-2 border border-border rounded bg-background font-medium"
                />
                <textarea
                  placeholder="Descripción"
                  value={p.descripcion}
                  onChange={(e) => {
                    const next = [...pasos]
                    next[i] = { ...next[i], descripcion: e.target.value }
                    setPasos(next)
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
                <div>
                  <label className="text-xs text-muted">Checklist (un ítem por línea)</label>
                  <textarea
                    placeholder="Item 1\nItem 2\nItem 3"
                    value={p.checklist.join('\n')}
                    onChange={(e) => {
                      const next = [...pasos]
                      next[i] = {
                        ...next[i],
                        checklist: e.target.value.split('\n').filter(Boolean),
                      }
                      setPasos(next)
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded bg-background text-sm mt-1"
                  />
                </div>
                <button
                  onClick={() => setPasos(pasos.filter((_, j) => j !== i))}
                  className="text-xs text-red-500"
                >
                  Eliminar paso
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {editing && (
            <>
              <button
                onClick={() => onShowHistorial(editing.id)}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated"
              >
                <History className="w-4 h-4" />
                Historial
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
                Borrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
