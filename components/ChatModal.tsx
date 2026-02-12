'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export interface ChatMessage {
  id?: number
  role?: 'human' | 'ai' | 'user' | 'assistant'
  message?: {
    type?: 'human' | 'ai'
    content?: string
  }
  content?: string
  created_at?: string
  timestamp?: string
}

interface ChatModalProps {
  lead: {
    manychat_id: string | null
    nombre: string | null
    username: string | null
  }
  onClose: () => void
  chatHistory: ChatMessage[] | string | null
  loading: boolean
  error: string | null
}

function parseChatHistory(raw: ChatMessage[] | string | null): ChatMessage[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      try {
        const cleaned = raw.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        const parsed = JSON.parse(cleaned)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        try {
          const doubleParsed = JSON.parse(JSON.parse(raw))
          return Array.isArray(doubleParsed) ? doubleParsed : []
        } catch {
          return []
        }
      }
    }
  }

  return []
}

function getMessageRole(msg: ChatMessage): 'user' | 'assistant' {
  if (msg.role === 'human' || msg.role === 'user') return 'user'
  if (msg.role === 'ai' || msg.role === 'assistant') return 'assistant'
  if (msg.message?.type === 'human') return 'user'
  if (msg.message?.type === 'ai') return 'assistant'
  return 'assistant'
}

function getMessageContent(msg: ChatMessage): string {
  return msg.message?.content ?? msg.content ?? ''
}

function getMessageTime(msg: ChatMessage): string {
  const ts = msg.created_at ?? msg.timestamp
  if (!ts) return ''
  const date = new Date(ts)
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChatModal({
  lead,
  onClose,
  chatHistory,
  loading,
  error,
}: ChatModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const messages = parseChatHistory(chatHistory)

  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages.length])

  const displayName = lead.username ? `@${lead.username}` : lead.nombre || 'Sin nombre'
  const manychatDisplay = lead.manychat_id || '—'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="flex flex-col rounded-xl border shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div>
            <div className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
              {displayName}
            </div>
            <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
              ManyChat ID: {manychatDisplay}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]"
          style={{
            backgroundColor: 'var(--color-background)',
            scrollbarColor: 'var(--color-border) var(--color-background)',
          }}
        >
          {loading && (
            <div
              className="text-center py-8 text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              Cargando conversación...
            </div>
          )}

          {error && (
            <div
              className="p-4 rounded-lg border text-sm"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderColor: 'rgba(239,68,68,0.3)',
                color: 'rgb(239,68,68)',
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div
              className="text-center py-8 text-sm"
              style={{ color: 'var(--color-muted)' }}
            >
              No hay mensajes para este lead
            </div>
          )}

          {!loading && !error && messages.length > 0 && (
            <>
              {messages.map((msg, idx) => {
                const role = getMessageRole(msg)
                const content = getMessageContent(msg)
                const time = getMessageTime(msg)

                if (!content.trim()) return null

                return (
                  <div
                    key={msg.id ?? idx}
                    className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-2.5"
                      style={
                        role === 'user'
                          ? {
                              backgroundColor: 'var(--color-accent)',
                              color: 'white',
                            }
                          : {
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-foreground)',
                              border: '1px solid var(--color-border)',
                            }
                      }
                    >
                      <div className="whitespace-pre-wrap break-words text-sm">
                        {content.trim()}
                      </div>
                      {time && (
                        <div
                          className="text-xs mt-1 opacity-80"
                          style={
                            role === 'user'
                              ? { color: 'rgba(255,255,255,0.9)' }
                              : { color: 'var(--color-muted)' }
                          }
                        >
                          {time}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
