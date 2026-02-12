-- Migración 016: Tabla n8n_chat_histories para historial de conversaciones
-- Usada por n8n/LangChain para almacenar mensajes de chat por sesión (manychat_id / session_id)

CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255),
  manychat_id VARCHAR(255),
  message JSONB,
  additional_kwargs JSONB DEFAULT '{}',
  response_metadata JSONB DEFAULT '{}',
  tool_calls JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "timestamp" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_n8n_chat_session_id ON n8n_chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_manychat_id ON n8n_chat_histories(manychat_id);

COMMENT ON TABLE n8n_chat_histories IS 'Historial de mensajes de chat por sesión (ManyChat/session_id)';
