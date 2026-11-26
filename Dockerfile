# ==========================================
# Dockerfile para CRM de WhatsApp con IA
# Optimizado para Node.js 22 + Next.js 16 + pnpm
# ==========================================

# 1. Base compartida con Node 22 y pnpm
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# 2. Instalar dependencias
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# 3. Compilación de Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Ejecutamos el build de producción
RUN pnpm run build

# 4. Imagen final ligera de ejecución
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8000
ENV PUERTO=8000

# Usuario no root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 crmuser

# Copiar archivos compilados y dependencias necesarias
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/perfiles ./perfiles
COPY --from=builder /app/next.config.ts ./next.config.ts

# Crear directorios para volúmenes persistentes y asignar permisos
RUN mkdir -p /app/datos /app/copias /app/logs && \
    chown -R crmuser:nodejs /app

USER crmuser

EXPOSE 8000

# Inicia Next.js escuchando en 0.0.0.0 y puerto 8000 (o el definido en PORT/PUERTO)
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "8000"]
