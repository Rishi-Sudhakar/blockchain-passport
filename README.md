# Blockchain Passport

A Digital Product Passport (DPP) and certification platform, modeled on the EU Battery
Regulation (EU 2023/1542). Manufacturers issue passports, certifiers review and approve
them, and anyone can verify a passport's compliance data and chain of custody via QR code —
all backed by a tamper-evident, cryptographically signed ledger.

## Stack

- **`apps/api`** — Go backend: chi router, pgx/Postgres, WebAuthn (passkey) auth, a
  hash-chain ledger behind a pluggable `Adapter` interface.
- **`apps/web`** — Next.js 16 (App Router) + TypeScript frontend: Tailwind v4, Framer Motion,
  TanStack Query, a "liquid glass" design system.
- **`infra`** — `docker-compose.yml` for local Postgres.

## Running locally

```bash
# 1. Postgres
cd infra && docker compose up -d postgres

# 2. Backend (from apps/api)
cd apps/api
go run ./cmd/migrate   # applies internal/migrations/*.sql
go run ./cmd/server    # listens on :8080

# 3. Frontend (from apps/web, in another terminal)
cd apps/web
npm install
npm run dev            # listens on :3000, proxies to :8080 via NEXT_PUBLIC_API_URL
```

Open `http://localhost:3000`. Registration and login use WebAuthn (Face ID / Touch ID /
Windows Hello / a security key) — this requires a real browser and platform authenticator,
so it can't be exercised from a script or CI headless run without a virtual authenticator.

## Testing

```bash
# Go unit + integration tests (DATABASE_URL needed for the ledger integration test)
cd apps/api
DATABASE_URL="postgres://passport:passport@localhost:5433/passport?sslmode=disable" go test ./...

# Frontend build/typecheck
cd apps/web
npm run build
```

See `docs/` (plan notes) for the full architecture writeup, and the code comments in
`internal/ledger` for the hash-chain design specifically.
