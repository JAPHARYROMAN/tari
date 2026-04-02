# Tari Web v1 — Deployment Guide

## Architecture

```
┌─────────┐     ┌──────────────┐     ┌────────────┐
│  Web    │────▶│  Server      │────▶│ PostgreSQL │
│ (Next)  │     │  (NestJS)    │────▶│ Redis      │
│ :3000   │◀───▶│  :4000       │────▶│ Cloudinary │
└─────────┘     └──────────────┘     └────────────┘
  Vercel /        Render / Railway     Managed
  Docker          / Docker             services
```

---

## Required Environment Variables

### Backend (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `PORT` | No | `4000` | Server port |
| `LOG_LEVEL` | No | `log` | `verbose` / `debug` / `log` / `warn` / `error` |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `REDIS_URL` | No | — | Full Redis URL (takes precedence over host/port) |
| `REDIS_HOST` | No | `localhost` | Redis host (if `REDIS_URL` not set) |
| `REDIS_PORT` | No | `6379` | Redis port (if `REDIS_URL` not set) |
| `REDIS_PASSWORD` | No | — | Redis password (if `REDIS_URL` not set) |
| `JWT_ACCESS_SECRET` | **Yes** | — | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | **Yes** | — | Refresh token HMAC secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `CLIENT_URL` | **Yes** | — | Frontend origin (e.g. `https://tari.example.com`) |
| `CORS_ALLOWED_ORIGINS` | No | — | Comma-separated extra CORS origins |
| `COOKIE_DOMAIN` | No | — | Cookie domain for cross-subdomain auth |
| `CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | — | Cloudinary API secret |

Generate secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`web/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:4000/api` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | **Yes** | `http://localhost:4000` | Backend WebSocket URL |
| `NEXT_PUBLIC_APP_URL` | No | — | This app's public URL |

> `NEXT_PUBLIC_*` variables are inlined at **build time** by Next.js. You must set them before running `next build`.

---

## Deployment Options

### Option A: Platform Deployment (Recommended)

**Frontend on Vercel:**

1. Import the `web/` directory as a Vercel project
2. Set root directory to `web`
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://api.tari.example.com/api`
   - `NEXT_PUBLIC_WS_URL` = `https://api.tari.example.com`
4. Vercel auto-detects Next.js — no further config needed

**Backend on Render / Railway:**

1. Create a new Web Service from the `server/` directory
2. Set build command: `npm ci && npx prisma generate && npm run build`
3. Set start command: `npm run deploy:start`
   - This runs `prisma migrate deploy` then `node dist/main`
4. Set all required environment variables (see table above)
5. Set health check path: `/api/health`

**Managed Services:**

- **PostgreSQL**: Neon, Supabase, Render Postgres, Railway Postgres
- **Redis**: Upstash, Render Redis, Railway Redis
- **Cloudinary**: [cloudinary.com](https://cloudinary.com) (free tier available)

### Option B: Docker Compose

For self-hosted or local production-like environments:

```bash
# 1. Create a root .env file with secrets
cat > .env << 'EOF'
JWT_ACCESS_SECRET=your-strong-access-secret-here-at-least-32-chars
JWT_REFRESH_SECRET=your-strong-refresh-secret-here-at-least-32-chars
CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# 2. Build and start all services
docker compose up --build -d

# 3. Run database migrations
docker compose exec server npx prisma migrate deploy

# 4. (Optional) Seed the database
docker compose exec server npx ts-node prisma/seed.ts
```

Verify: `curl http://localhost:4000/api/health`

---

## Database Migrations

Prisma handles schema changes through migrations.

### Development
```bash
cd server

# Create a new migration after changing schema.prisma
npm run prisma:migrate:dev

# Open Prisma Studio to browse data
npm run prisma:studio
```

### Production
```bash
cd server

# Apply pending migrations (safe, non-interactive)
npm run prisma:migrate:deploy

# Or use the combined deploy script
npm run deploy:start  # migrate + start
```

> Never run `prisma migrate dev` in production. Always use `prisma migrate deploy`.

---

## CORS / Cookie / Auth Notes

- Auth uses **Bearer tokens** in the `Authorization` header (not cookies)
- Refresh tokens are opaque hex strings stored as SHA-256 hashes in the `Session` table
- CORS is configured to allow the `CLIENT_URL` origin with credentials
- Additional origins can be added via `CORS_ALLOWED_ORIGINS` (comma-separated)
- WebSocket gateway uses the same CORS configuration
- In production behind a reverse proxy, `trust proxy` is enabled so `req.ip` reflects the real client IP
- Helmet sets security headers automatically in production

### Domain Setup Example

```
Frontend: https://tari.example.com       → CLIENT_URL
Backend:  https://api.tari.example.com   → NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WS_URL
```

Set `CLIENT_URL=https://tari.example.com` on the backend so CORS allows frontend requests.

---

## Health Check

```
GET /api/health
```

Returns:
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": {
    "database": "ok",
    "redis": "ok"
  }
}
```

`status` is `"ok"` when all services are reachable, `"degraded"` otherwise.

Use this endpoint for:
- Load balancer health checks
- Uptime monitoring
- Container orchestrator liveness probes

---

## Quick Reference: Build & Start

### Backend
```bash
cd server
npm ci
npx prisma generate
npm run build
npm run deploy:start     # migrate + start
# or separately:
npx prisma migrate deploy
node dist/main
```

### Frontend
```bash
cd web
npm ci
NEXT_PUBLIC_API_URL=https://api.example.com/api \
NEXT_PUBLIC_WS_URL=https://api.example.com \
npm run build
npm start
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| CORS errors in browser | `CLIENT_URL` matches the exact frontend origin (protocol + domain + port) |
| WebSocket won't connect | `NEXT_PUBLIC_WS_URL` points to backend base URL (no `/api` suffix) |
| 401 on all requests | `JWT_ACCESS_SECRET` is the same across server restarts |
| Health check shows `degraded` | Verify `DATABASE_URL` and `REDIS_URL`/`REDIS_HOST` are reachable |
| Prisma errors on start | Run `npx prisma migrate deploy` before starting the server |
| Images not loading | Configure `CLOUDINARY_*` env vars; check `next.config.ts` remote patterns |
