PROJECT STATE — DO NOT MODIFY WITHOUT CONFIRMATION

PURPOSE

Single source of truth for the Trades Admin / JobAdmin app.
Anything not written here is considered unknown.

⸻

WHAT WORKS (CONFIRMED)
	•	Domain jobadmin.co.uk resolves and loads the React SPA over HTTPS
	•	Caddy reverse proxy is running and serving frontend (port 8080)
	•	Backend Node/Express API is running (port 3000)
	•	Authentication works (login with JWT, auth middleware active)
	•	Income and Expenses CRUD endpoints work
	•	Weekly dashboard data endpoint returns data
	•	SQLite database works in production (Prisma)

WHAT IS FROZEN (MUST NOT CHANGE)
	•	Server: Hetzner VPS (Ubuntu 22.04)
	•	Reverse proxy: Caddy
	•	Backend stack: Node.js + Express + Prisma
	•	Database: SQLite (production for now)
	•	Frontend stack: React SPA
	•	Domain + SSL setup (Cloudflare + HTTPS)

WHAT IS BROKEN (KNOWN ISSUES)
	•	HTTPS / certificate behaviour inconsistent between www and non-www at times
	•	Debugging often causes regressions due to mixed concerns
	•	No strict separation between frontend / backend / infra changes

CURRENT FOCUS (ONE ITEM ONLY)
	•	Stabilisation: prevent regressions and uncontrolled changes

LAST VERIFIED DATE
	•	2026-01-17