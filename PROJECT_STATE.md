PROJECT STATE — DO NOT MODIFY WITHOUT CONFIRMATION

PURPOSE

Single source of truth for the Trades Admin / JobAdmin app.
Anything not written here is considered unknown.

⸻

WHAT WORKS (CONFIRMED)
	-	Domain jobadmin.co.uk resolves and loads the React SPA over HTTPS
	-	Caddy reverse proxy is running and serving frontend (port 8080)
	-	Backend Node/Express API is running (port 3000)
	-	Authentication works (login with JWT, auth middleware active)
	-	Income and Expenses CRUD endpoints work
	-	Weekly dashboard data endpoint returns data
	-	SQLite database works in production (Prisma)

WHAT IS FROZEN (MUST NOT CHANGE)
	-	Server: Hetzner VPS (Ubuntu 22.04)
	-	Reverse proxy: Caddy
	-	Backend stack: Node.js + Express + Prisma
	-	Database: SQLite (production for now)
	-	Frontend stack: React SPA
	-	Domain + SSL setup (Cloudflare + HTTPS)

WHAT IS BROKEN (KNOWN ISSUES)
	-	HTTPS / certificate behaviour inconsistent between www and non-www at times
	-	Debugging often causes regressions due to mixed concerns
	-	No strict separation between frontend / backend / infra changes

CURRENT FOCUS (ONE ITEM ONLY)
	-	Stabilisation: prevent regressions and uncontrolled changes

WORKFLOW RULES	

	-	All work must start here
	- 	One invariant per session
	-	One role chat active at a time
	-	PROJECT_STATE.md is the source of truth

PROJECT STATE GOVERNANCE (PERMANENT)

- PROJECT_STATE.md lives in the Git repository root
- Git is the single source of truth
- Local edits only; server copy is read-only via deploy
- Any change requires:
  - explicit session authorisation
  - dated entry
- No undocumented changes are valid
- If not committed, it does not exist

DECISION — FRONTEND DEPLOYMENT SIMPLIFICATION (PROPOSED)

Reason:
- Frontend-only bugs require full Docker rebuild + Portainer intervention
- This is too costly for solo development and stabilisation

Proposal:
- Frontend served as static build via Caddy
- Docker/Portainer retained for backend only

Status:
- Proposed, not executed
- Requires explicit approval before changes

FRONTEND DEPLOYMENT — ORIGINAL RATIONALE

- Docker/Portainer chosen to standardise runtime environment
- Intended to mirror future CI/CD pipeline
- Intended to isolate frontend build from server OS
- Assumed frequent image rebuilds would be acceptable
- Assumed Portainer UI would reduce operational risk

FRONTEND DEPLOYMENT — CURRENT CONSTRAINTS

- Solo developer, no CI/CD pipeline
- High iteration frequency on frontend UI
- Docker image rebuild + Portainer update too slow for stabilisation
- Difficult to verify what code is actually running
- Debugging effort disproportionate to change size
- Increases cognitive load and error risk

FRONTEND DEPLOYMENT — PROPOSED TRANSITION PLAN

Goal:
- Reduce deployment complexity during stabilisation
- Preserve rollback path

Plan:
1. Keep backend Docker/Portainer unchanged
2. Remove frontend container only
3. Build frontend locally (Vite build)
4. Serve static frontend via Caddy
5. Verify parity with current production
6. Keep Docker-based frontend as rollback option

Risk mitigation:
- One-session execution
- Immediate rollback possible
- No backend or database changes

FIX LOG

[2026-01-17]
Bug: Income Edit form shows blank customer and description fields
Scope: Frontend only (IncomeList → TransactionForm)
Cause: Missing / incorrect initialData mapping (customerName passed as name, description missing)
Fix: initialData now includes customerName and description
Verification: Static inspection (local backend unavailable)
Status: FIXED — VERIFIED BY INSPECTION

[2026-01-17]
Issue: Backend failed to start locally
Scope: Local environment only
Cause 1: Invalid option `trustProxy` in express-rate-limit configuration
Fix 1: Removed unsupported `trustProxy` option from rateLimit middleware
Cause 2: Resend client instantiated without API key at import time
Fix 2: Guarded Resend initialization so backend starts without RESEND_API_KEY
Verification: Local backend starts via `npm run dev`
Status: FIXED — LOCAL STARTABILITY RESTORED

LAST VERIFIED DATE
	•	2026-01-17