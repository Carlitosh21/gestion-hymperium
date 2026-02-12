'use client'

import { ExternalLink, Pencil, Trash2, UserPlus, Info, MessageCircle } from 'lucide-react'

export interface Lead {
  id: number
  manychat_id: string | null
  nombre: string | null
  username: string | null
  estado: string
  ultima_interaccion: string | null
  created_at: string
}

interface LeadActionsPopoverProps {
  lead: Lead
  isOpen: boolean
  onToggle: () => void
  onOpenInstagram: (username: string | null) => void
  onLeerConversacion: (lead: Lead) => void
  onEdit: (lead: Lead) => void
  onDerivar: (lead: Lead) => void
  onDelete: (lead: Lead) => void
}

export function LeadActionsPopover({
  lead,
  isOpen,
  onToggle,
  onOpenInstagram,
  onLeerConversacion,
  onEdit,
  onDerivar,
  onDelete,
}: LeadActionsPopoverProps) {
  const runAndClose = (fn: () => void) => {
    fn()
    onToggle()
  }

  return (
    <div className="relative flex items-center">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="p-1.5 hover:bg-surface rounded transition-colors"
        title="Acciones"
      >
        <Info className="w-4 h-4 text-muted" />
      </button>
      {isOpen && (
        <div
          data-lead-actions-popover
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] py-1 bg-surface border border-border rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.username && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                runAndClose(() => onOpenInstagram(lead.username))
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-muted" />
              Abrir Instagram
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              runAndClose(() => onLeerConversacion(lead))
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-muted" />
            Leer Conversación
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              runAndClose(() => onEdit(lead))
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated flex items-center gap-2"
          >
            <Pencil className="w-4 h-4 text-muted" />
            Editar
          </button>
          {lead.manychat_id && lead.estado !== 'Derivado' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                runAndClose(() => onDerivar(lead))
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-muted" />
              Derivar
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              runAndClose(() => onDelete(lead))
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-surface-elevated flex items-center gap-2 text-red-500"
          >
            <Trash2 className="w-4 h-4" />
            Borrar
          </button>
        </div>
      )}
    </div>
  )
}
