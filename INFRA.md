# Infrastructure Overview (Production)

## Server
- Provider: Hetzner Cloud
- OS: Ubuntu 22.04 LTS
- User: daniel (password login disabled, SSH key only)

## Domains & DNS
- Domain: jobadmin.co.uk
- DNS: Cloudflare
- A record → server public IPv4

## Reverse Proxy & HTTPS
- Caddy (system service)
- Automatic HTTPS via Let’s Encrypt
- Routes:
  - /auth, /income, /expenses, /dashboard, /settings → backend (localhost:3000)
  - all other paths → frontend (localhost:8080)

## Containers
Managed via Docker Compose (production)

### Backend
- Node.js + Express
- Port: 3000
- Database: SQLite (mounted volume)
- Prisma migrations applied inside container

### Frontend
- Vite + React
- Built to static files
- Served by nginx inside container
- Internal port: 8080

## Data & Persistence
- SQLite DB path (host):
  ~/apps/trades_admin/production/data/sqlite/dev.db
- Mounted into backend container at /app/data/dev.db

## Backups
- Folder: ~/backups/trades_admin
- Script: backup_sqlite.sh
- Strategy: copy SQLite DB (ready for cron)

## Git & Repo Structure
Single repo:
- appbackend/
- appfrontend/
- INFRA.md (this file)

Local and production kept in sync manually.

## Access
- SSH: Mac terminal → ssh daniel@<server-ip>
- No root login
- Docker group enabled for daniel

## Caddy routing (IMPORTANT)

Use `handle`, NOT `handle_path`.

Reason:
`handle_path` strips the URL prefix and breaks Express routes
(e.g. /auth/login becomes /login → 404).

Current working pattern:

- /auth/*
- /dashboard*
- /income*
- /expenses*
- /settings*

All reverse_proxy → backend (3000)
Fallback → frontend (8080)
