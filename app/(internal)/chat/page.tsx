'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, MessageSquare, Trash2, Pencil } from 'lucide-react'

const THREADS_STORAGE_KEY = 'chat_threads'

interface Thread {
  id: string
  nombre: string
  sessionId: string
}

interface DisplayMessage {
  id: string
  role: 'user' | 'bot'
  content: string
}

function parseHistoryToMessages(rows: any[]): DisplayMessage[] {
  const out: DisplayMessage[] = []
  rows.forEach((row, idx) => {
    const msg = row?.message
    const content = msg?.content ?? row?.content ?? ''
    if (!content.trim()) return
    const type = msg?.type ?? row?.role
    const role = type === 'human' || type === 'user' ? 'user' : 'bot'
    out.push({
      id: `hist-${row.id ?? idx}`,
      role,
      content: content.trim(),
    })
  })
  return out
}

function generateId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editThreadId, setEditThreadId] = useState<string | null>(null)
  const [editNombre, setEditNombre] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THREADS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Thread[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed)
          if (!activeThread) {
            setActiveThread(parsed[0])
          }
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads))
    }
  }, [threads])

  useEffect(() => {
    if (activeThread) {
      setHistoryLoading(true)
      fetch(`/api/chat/history?sessionId=${encodeURIComponent(activeThread.sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          const rows = data.chatHistory ?? []
          setMessages(parseHistoryToMessages(rows))
        })
        .catch(() => setMessages([]))
        .finally(() => setHistoryLoading(false))
    } else {
      setMessages([])
    }
  }, [activeThread?.id, activeThread?.sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleNewThread = () => {
    const sessionId = `newbody-${Date.now()}`
    const thread: Thread = {
      id: generateId(),
      nombre: 'Nuevo chat',
      sessionId,
    }
    setThreads((prev) => [...prev, thread])
    setActiveThread(thread)
    setEditThreadId(thread.id)
    setEditNombre(thread.nombre)
  }

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id)
      if (activeThread?.id === id) {
        setActiveThread(next[0] ?? null)
      }
      return next
    })
  }

  const handleRenameThread = (id: string, nombre: string) => {
    if (!nombre.trim()) return
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, nombre: nombre.trim() } : t))
    )
    setEditThreadId(null)
    if (activeThread?.id === id) {
      setActiveThread((prev) => (prev ? { ...prev, nombre: nombre.trim() } : null))
    }
  }

  const addBotMessageSmart = (reply: string) => {
    const parts = reply.split(/\n{2,}/)
    const newMsgs: DisplayMessage[] = parts
      .filter((p) => p.trim())
      .map((part, i) => ({
        id: `bot-${Date.now()}-${i}`,
        role: 'bot' as const,
        content: part.trim(),
      }))
    if (newMsgs.length > 0) {
      setMessages((prev) => [...prev, ...newMsgs])
    } else {
      setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, role: 'bot', content: reply }])
    }
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !activeThread || sending) return

    setInput('')
    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: text }])
    setSending(true)

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: text,
          sessionId: activeThread.sessionId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        addBotMessageSmart(data.error || 'Error al conectar con el chat')
        return
      }

      const reply = data.reply ?? ''
      if (reply.includes('\n\n')) {
        addBotMessageSmart(reply)
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `bot-${Date.now()}`, role: 'bot', content: reply || '...' },
        ])
      }
    } catch {
      addBotMessageSmart('Error al conectar con el chat')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const displayMessages =
    messages.length === 0 && !historyLoading
      ? [
          { id: 'w-1', role: 'bot' as const, content: 'Hola 👋' },
          { id: 'w-2', role: 'bot' as const, content: 'Soy Analista New Body. ¿En qué puedo ayudarte hoy?' },
        ]
      : messages

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar threads */}
      <div
        className="w-64 shrink-0 flex flex-col border-r"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-foreground)' }}>
            Conversaciones
          </h2>
          <button
            onClick={handleNewThread}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'white',
            }}
          >
            <Plus className="w-4 h-4" />
            Nuevo hilo
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {threads.length === 0 && (
            <p className="text-sm px-3" style={{ color: 'var(--color-muted)' }}>
              Creá un hilo para empezar
            </p>
          )}
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer ${
                activeThread?.id === t.id ? 'bg-surface-elevated' : 'hover:bg-surface-elevated'
              }`}
              style={{ backgroundColor: activeThread?.id === t.id ? 'var(--color-surface-elevated)' : undefined }}
            >
              {editThreadId === t.id ? (
                <input
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  onBlur={() => handleRenameThread(t.id, editNombre)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameThread(t.id, editNombre)
                  }}
                  autoFocus
                  className="flex-1 text-sm py-1 px-2 rounded border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-foreground)',
                  }}
                />
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 shrink-0" style={{ color: 'var(--color-muted)' }} />
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => setActiveThread(t)}
                  >
                    <div className="text-sm truncate" style={{ color: 'var(--color-foreground)' }}>
                      {t.nombre}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                      {t.sessionId.slice(0, 12)}…
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditThreadId(t.id)
                        setEditNombre(t.nombre)
                      }}
                      className="p-1 rounded hover:bg-surface"
                      style={{ color: 'var(--color-muted)' }}
                      aria-label="Renombrar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('¿Borrar este hilo?')) handleDeleteThread(t.id)
                      }}
                      className="p-1 rounded hover:bg-red-500/20 text-red-500"
                      aria-label="Borrar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Panel chat */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        {activeThread ? (
          <>
            <div
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
              style={{ scrollbarColor: 'var(--color-border) transparent' }}
            >
              {historyLoading && (
                <div className="text-center py-4 text-sm" style={{ color: 'var(--color-muted)' }}>
                  Cargando...
                </div>
              )}
              {!historyLoading &&
                displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[75%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words text-sm"
                      style={
                        msg.role === 'user'
                          ? {
                              backgroundColor: 'var(--color-accent)',
                              color: 'white',
                              borderBottomRightRadius: 4,
                              borderBottomLeftRadius: 20,
                              borderTopLeftRadius: 20,
                              borderTopRightRadius: 20,
                            }
                          : {
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-foreground)',
                              border: '1px solid var(--color-border)',
                              borderBottomLeftRadius: 4,
                              borderBottomRightRadius: 20,
                              borderTopLeftRadius: 20,
                              borderTopRightRadius: 20,
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              {sending && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-4 py-2.5 text-sm"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-muted)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    ...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div
              className="flex gap-2 p-3 border-t"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribí tu mensaje..."
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-full text-base border outline-none focus:ring-2 focus:ring-accent/30"
                style={{
                  backgroundColor: 'var(--color-background)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-foreground)',
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="px-6 py-2.5 rounded-full font-medium text-base disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                }}
              >
                Enviar
              </button>
            </div>
          </>
        ) : (
          <div
            className="flex-1 flex items-center justify-center"
            style={{ color: 'var(--color-muted)' }}
          >
            <p className="text-lg">Creá un hilo o seleccioná uno para empezar</p>
          </div>
        )}
      </div>
    </div>
  )
}
