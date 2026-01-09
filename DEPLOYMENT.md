# Deployment Guide (Production)

This document is the single source of truth for deploying Trades Admin.
Do not improvise. Follow steps exactly.

---

## Invariants (Do Not Break)

- Git repo is the only source of truth for code
- No manual code edits on the server
- Docker images are build artifacts only
- Prisma client is generated inside Docker
- Active production path on server:
  /home/daniel/apps/trades-admin/production

---

## Versions (Pinned)

- Node.js: 18
- Frontend image: production-frontend:api
- Backend image: production-backend:api
- Frontend port: 8080
- Backend port: 3000
- API base path: /api

---

## Pre-Deploy Checklist (Laptop)

Run before ANY deployment:

1. Repository clean:
   git status
   → must say: working tree clean

2. App builds locally:
   - frontend builds without errors
   - backend tests (if any) pass

If any check fails: STOP.

---

## Frontend Deployment (Production)

### 1. Build image on server

On server:
cd /home/daniel/apps/trades-admin/build/appfrontend

docker build -t production-frontend:api .

### 2. Replace container

docker stop trades_admin_frontend
docker rm trades_admin_frontend

docker run -d \
  --name trades_admin_frontend \
  -p 8080:80 \
  production-frontend:api

### 3. Verify

- https://jobadmin.co.uk loads
- Hard refresh on /dashboard works
- No 404 on refresh

---

## Backend Deployment (Production)

### 1. Build image on server

On server:
cd /home/daniel/apps/trades-admin/build/appbackend

docker build -t production-backend:api .

### 2. Replace container

docker stop trades_admin_backend
docker rm trades_admin_backend

docker run -d \
  --name trades_admin_backend \
  -p 3000:3000 \
  -v /home/daniel/apps/trades-admin/production/data/sqlite:/app/data \
  -e DATABASE_URL=file:/app/data/dev.db \
  -e JWT_SECRET=<<PROD_SECRET>> \
  production-backend:api

### 3. Verify

curl https://jobadmin.co.uk/api/health
→ {"status":"ok"}

---

## Rollback (Immediate)

If something breaks:

docker stop trades_admin_frontend trades_admin_backend
docker rm trades_admin_frontend trades_admin_backend

docker run previous known-good images
(see docker images)

If DB is corrupted:
- Restore latest backup from:
  /home/daniel/apps/trades-admin/production/backups

---

## Backups

- Script:
  /home/daniel/apps/trades-admin/production/backup_sqlite.sh
- Schedule:
  Daily at 02:00
- Retention:
  Last 14 backups

---

## Rules

- Never edit containers
- Never hotfix on server
- Infra changes must be written in INFRA.md first
- If unsure: STOP and diagnose
