# Dockerfile multi-stage para Easy Panel
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias (usa npm install si no hay package-lock.json)
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiar solo lo necesario desde builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Exponer puerto
EXPOSE 3000

ENV PORT=3000

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
