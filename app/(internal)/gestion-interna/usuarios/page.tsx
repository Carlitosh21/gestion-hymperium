'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pencil, Trash2, UserPlus, Key } from 'lucide-react'

interface Usuario {
  id: number
  email: string
  role: string
  roleId: number | null
  roleName: string | null
  activo: boolean
  createdAt: string
}

interface Rol {
  id: number
  name: string
  description: string | null
  permissionIds: number[]
}

interface Permission {
  id: number
  key: string
  description: string | null
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'usuarios' | 'roles'>('usuarios')
  const [showFormUsuario, setShowFormUsuario] = useState(false)
  const [showFormRol, setShowFormRol] = useState(false)
  const [editUsuario, setEditUsuario] = useState<Usuario | null>(null)
  const [editRol, setEditRol] = useState<Rol | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/gestion-interna/usuarios'),
        fetch('/api/gestion-interna/roles'),
      ])

      if (!usersRes.ok) {
        if (usersRes.status === 403) {
          setError('Sin permiso para gestionar usuarios')
          return
        }
        throw new Error('Error al cargar usuarios')
      }
      if (!rolesRes.ok) {
        if (rolesRes.status === 403) {
          setError('Sin permiso para gestionar roles')
          return
        }
        throw new Error('Error al cargar roles')
      }

      setUsuarios(await usersRes.json())
      const rolesData = await rolesRes.json()
      setRoles(rolesData.roles || [])
      setPermissions(rolesData.permissions || [])
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/gestion-interna" className="text-accent hover:underline text-sm mb-4 inline-block">
          ← Volver a Gestión Interna
        </Link>
        <h1 className="text-4xl font-semibold mb-2">Usuarios y Roles</h1>
        <p className="text-muted text-lg">Gestión de usuarios internos y permisos RBAC</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b border-border">
        {[
          { id: 'usuarios', label: 'Usuarios' },
          { id: 'roles', label: 'Roles' },
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
      ) : activeTab === 'usuarios' ? (
        <UsuariosTab
          usuarios={usuarios}
          roles={roles}
          onRefresh={fetchData}
          showForm={showFormUsuario}
          setShowForm={setShowFormUsuario}
          editUsuario={editUsuario}
          setEditUsuario={setEditUsuario}
        />
      ) : (
        <RolesTab
          roles={roles}
          permissions={permissions}
          onRefresh={fetchData}
          showForm={showFormRol}
          setShowForm={setShowFormRol}
          editRol={editRol}
          setEditRol={setEditRol}
        />
      )}
    </div>
  )
}

function UsuariosTab({
  usuarios,
  roles,
  onRefresh,
  showForm,
  setShowForm,
  editUsuario,
  setEditUsuario,
}: {
  usuarios: Usuario[]
  roles: Rol[]
  onRefresh: () => void
  showForm: boolean
  setShowForm: (v: boolean) => void
  editUsuario: Usuario | null
  setEditUsuario: (u: Usuario | null) => void
}) {
  const [formData, setFormData] = useState({ email: '', password: '', roleId: '' })
  const [editData, setEditData] = useState({ roleId: '', activo: true, password: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (editUsuario) {
      setEditData({
        roleId: String(editUsuario.roleId ?? ''),
        activo: editUsuario.activo,
        password: '',
      })
    }
  }, [editUsuario])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch('/api/gestion-interna/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          roleId: formData.roleId ? parseInt(formData.roleId) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear usuario')
      setShowForm(false)
      setFormData({ email: '', password: '', roleId: '' })
      onRefresh()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUsuario) return
    setSaving(true)
    setErr(null)
    try {
      const payload: any = { roleId: editData.roleId ? parseInt(editData.roleId) : null, activo: editData.activo }
      if (editData.password) payload.password = editData.password

      const res = await fetch(`/api/gestion-interna/usuarios/${editUsuario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')
      setEditUsuario(null)
      onRefresh()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDesactivar = async (u: Usuario) => {
    if (!confirm(`¿Desactivar a ${u.email}?`)) return
    try {
      const res = await fetch(`/api/gestion-interna/usuarios/${u.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al desactivar')
      onRefresh()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Usuarios internos</h3>
        <button
          onClick={() => (editUsuario ? setEditUsuario(null) : setShowForm(!showForm))}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? 'Cancelar' : '+ Nuevo usuario'}
        </button>
      </div>

      {(showForm || editUsuario) && (
        <form
          onSubmit={editUsuario ? handleUpdate : handleCreate}
          className="mb-6 p-6 bg-surface-elevated rounded-lg border border-border space-y-4"
        >
          {err && <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{err}</div>}
          {editUsuario ? (
            <>
              <p className="text-sm text-muted">Editando: {editUsuario.email}</p>
              <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <select
                  value={editData.roleId}
                  onChange={(e) => setEditData({ ...editData, roleId: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Sin rol</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Activo</label>
                <select
                  value={editData.activo ? '1' : '0'}
                  onChange={(e) => setEditData({ ...editData, activo: e.target.value === '1' })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="1">Sí</option>
                  <option value="0">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nueva contraseña (dejar vacío para no cambiar)</label>
                <input
                  type="password"
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contraseña *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Rol</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Sin rol</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditUsuario(null) }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editUsuario ? 'Guardar' : 'Crear usuario'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {usuarios.map((u) => (
          <div
            key={u.id}
            className={`p-4 rounded-lg border ${u.activo ? 'bg-surface-elevated border-border' : 'bg-surface-elevated/50 border-border opacity-75'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{u.email}</p>
                <p className="text-sm text-muted">
                  Rol: {u.roleName || u.role || '—'} {!u.activo && '(desactivado)'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditUsuario(u)}
                  className="p-2 hover:bg-surface rounded transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4 text-muted" />
                </button>
                {u.activo && (
                  <button
                    onClick={() => handleDesactivar(u)}
                    className="p-2 hover:bg-surface rounded transition-colors"
                    title="Desactivar"
                  >
                    <Trash2 className="w-4 h-4 text-muted" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RolesTab({
  roles,
  permissions,
  onRefresh,
  showForm,
  setShowForm,
  editRol,
  setEditRol,
}: {
  roles: Rol[]
  permissions: Permission[]
  onRefresh: () => void
  showForm: boolean
  setShowForm: (v: boolean) => void
  editRol: Rol | null
  setEditRol: (r: Rol | null) => void
}) {
  const [formData, setFormData] = useState({ name: '', description: '', permissionIds: [] as number[] })
  const [editData, setEditData] = useState({ name: '', description: '', permissionIds: [] as number[] })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (editRol) {
      setEditData({
        name: editRol.name,
        description: editRol.description || '',
        permissionIds: editRol.permissionIds || [],
      })
    }
  }, [editRol])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch('/api/gestion-interna/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          permissionIds: formData.permissionIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear rol')
      setShowForm(false)
      setFormData({ name: '', description: '', permissionIds: [] })
      onRefresh()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editRol) return
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch(`/api/gestion-interna/roles/${editRol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          description: editData.description || null,
          permissionIds: editData.permissionIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')
      setEditRol(null)
      onRefresh()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const togglePerm = (ids: number[], permId: number) => {
    if (ids.includes(permId)) return ids.filter((id) => id !== permId)
    return [...ids, permId]
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Roles</h3>
        <button
          onClick={() => (editRol ? setEditRol(null) : setShowForm(!showForm))}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent-hover transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Nuevo rol'}
        </button>
      </div>

      {(showForm || editRol) && (
        <form
          onSubmit={editRol ? handleUpdate : handleCreate}
          className="mb-6 p-6 bg-surface-elevated rounded-lg border border-border space-y-4"
        >
          {err && <div className="p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">{err}</div>}
          <div>
            <label className="block text-sm font-medium mb-2">Nombre *</label>
            <input
              type="text"
              required
              value={editRol ? editData.name : formData.name}
              onChange={(e) =>
                editRol
                  ? setEditData({ ...editData, name: e.target.value })
                  : setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <input
              type="text"
              value={editRol ? editData.description : formData.description}
              onChange={(e) =>
                editRol
                  ? setEditData({ ...editData, description: e.target.value })
                  : setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg bg-background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Permisos</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {permissions.map((p) => {
                const ids = editRol ? editData.permissionIds : formData.permissionIds
                const checked = ids.includes(p.id)
                return (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        editRol
                          ? setEditData({ ...editData, permissionIds: togglePerm(editData.permissionIds, p.id) })
                          : setFormData({ ...formData, permissionIds: togglePerm(formData.permissionIds, p.id) })
                      }
                    />
                    <span className="text-sm">{p.key}</span>
                  </label>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditRol(null) }}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
            >
              {saving ? 'Guardando...' : editRol ? 'Guardar' : 'Crear rol'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {roles.map((r) => (
          <div key={r.id} className="p-4 bg-surface-elevated rounded-lg border border-border">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{r.name}</p>
                {r.description && <p className="text-sm text-muted">{r.description}</p>}
                <p className="text-xs text-muted mt-1">
                  {r.permissionIds?.length || 0} permisos
                </p>
              </div>
              <button
                onClick={() => setEditRol(r)}
                className="p-2 hover:bg-surface rounded transition-colors"
                title="Editar"
              >
                <Pencil className="w-4 h-4 text-muted" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
