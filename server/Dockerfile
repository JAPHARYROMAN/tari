# ── Stage 1: Install dependencies ────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts && \
    npx prisma generate

# ── Stage 2: Build ───────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .

RUN npm run build

# ── Stage 3: Production runtime ─────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# argon2 requires build tools — install only if needed for native rebuild
RUN apk add --no-cache dumb-init

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=deps /app/package.json ./package.json
COPY prisma ./prisma/

# Re-generate Prisma client for the runtime platform
RUN npx prisma generate

EXPOSE 4000

# Use dumb-init to handle signals properly
CMD ["dumb-init", "node", "dist/main"]
