# Blockchain Passport

A side project built purely out of personal interest in Digital Product Passports (DPPs) and
the EU Battery Regulation (EU 2023/1542) — not a production system, just an attempt to build
the idea properly: manufacturers issue passports for their products, an independent certifier
reviews and signs off on them, and anyone can scan a QR code to see the compliance data and
its chain of custody, no account required.

Every state change (submit, certify, publish, amend, end-of-life) is written to a
tamper-evident, hash-chained ledger and signed client-side with a non-custodial ECDSA key
that never leaves the device it was created on. Break a single record and the chain fails
verification.

It's one backend and one Postgres-backed ledger behind two clients — a web app and a native
mobile app — mostly as an excuse to build the same flows twice and see how the design and
signing logic held up on both.

## Screenshots

### Web

| Certifier — approver view | Manufacturer — certificate adder view |
| --- | --- |
| ![Web approver view](docs/screenshots/web-approver.png) | ![Web certificate adder view](docs/screenshots/web-certificate-adder.png) |

### Mobile

| Certifier — approver view | Manufacturer — certificate adder view |
| --- | --- |
| ![Mobile approver view](docs/screenshots/mobile-approver.png) | ![Mobile certificate adder view](docs/screenshots/mobile-certificate-adder.png) |

*(Screenshots to be added — drop the corresponding PNGs into `docs/screenshots/` using the
filenames above.)*

## Why

Wanted to see what a backend-simulated tamper-evident ledger actually takes to build
properly — schema, cryptography, and a UI on both web and native — rather than a form wizard
bolted onto a database.

## How the ledger works

Each ledger record hashes its own payload together with the previous record's hash, its
event type, the passport ID, a sequence number, and the signing timestamp:

```
record_hash = SHA256(prev_hash | payload_hash | event_type | passport_id | seq | signed_at)
```

The client (web or mobile) prepares the unsigned record, signs the resulting digest with an
ECDSA P-256 key held only on that device, and the server commits it inside a
`pg_advisory_xact_lock`-guarded transaction — verifying the signature and the chain linkage
before it's allowed to land. `GET /public/passports/:code` re-walks and re-verifies the
entire chain on every request, so tampering is never just theoretical.

## Stack

| App | Stack |
| --- | --- |
| `apps/api` | Go, chi router, pgx (no ORM), hand-rolled SQL migrations, go-webauthn for passkeys |
| `apps/web` | Next.js 16 (App Router), TypeScript, Tailwind v4, Framer Motion, TanStack Query |
| `apps/mobile` | React Native + Expo (SDK 54), expo-router, Reanimated, `@noble/curves` for on-device signing |

Design language is a light neo-brutalist system shared across both clients: solid fills,
thick black borders, hard offset shadows, no gradients or blur.

Auth is WebAuthn passkeys on web (Face ID / Touch ID / Windows Hello / a security key).
Mobile can't scope a passkey to a LAN IP, so it uses a short-lived 6-character pairing code
generated from an already-authenticated web session instead — each device then gets its own
non-custodial signing key, independent of how it logged in.

## Project structure

```
apps/
  api/      Go backend — ledger, passport/certification services, WebAuthn, device pairing
  web/      Next.js frontend
  mobile/   Expo/React Native app
infra/      docker-compose.yml for local Postgres
docs/       screenshots
```

## Getting started

### Prerequisites

- Go 1.26+
- Node 20+
- Docker (for local Postgres)
- Expo Go on a physical device, or an iOS/Android simulator, for the mobile app

### 1. Database

```bash
cd infra
docker compose up -d postgres
```

### 2. Backend

```bash
cd apps/api
go run ./cmd/migrate   # applies internal/migrations/*.sql
go run ./cmd/server    # listens on :8080
```

Config is env-driven with sane local defaults — override only if needed:

| Variable | Default |
| --- | --- |
| `API_ADDR` | `:8080` |
| `DATABASE_URL` | `postgres://passport:passport@localhost:5433/passport?sslmode=disable` |
| `WEBAUTHN_RPID` | `localhost` |
| `WEBAUTHN_ORIGIN` | `http://localhost:3000` |
| `COOKIE_SECURE` | `false` |

### 3. Web app

```bash
cd apps/web
npm install
npm run dev   # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` if the API isn't on `localhost:8080`.

Register as either a **manufacturer** (issues passports) or a **certifier** (reviews them) —
the passkey prompt needs a real browser with a platform authenticator, so this flow can't be
scripted or run headlessly without a virtual authenticator.

### 4. Mobile app

The mobile app talks to the same backend over your LAN, so it needs your machine's LAN IP,
not `localhost`:

```bash
cd apps/mobile
cp .env.example .env   # then set EXPO_PUBLIC_API_URL to http://<your-lan-ip>:8080
npm install
npm start
```

Scan the QR code with Expo Go (SDK 54). Since WebAuthn passkeys can't be scoped to a LAN IP,
sign in on **web** first, then open **Profile → Pair the mobile app** to generate a
6-character code and enter it on the mobile app's pairing screen.

### 5. Demo data (optional)

Register two accounts on web first — a manufacturer at `test@abc.com` and a certifier at
`abc@test.com` — then run:

```bash
cd apps/api
go run ./cmd/seed
```

This drives ten mock battery passports through the real prepare → sign → commit flow,
covering every lifecycle status (draft, submitted, rejected, certified, published, amended,
end-of-life), so both accounts have realistic data to look at immediately.

## Testing

```bash
# Go unit + integration tests (the ledger integration test needs a live DATABASE_URL)
cd apps/api
DATABASE_URL="postgres://passport:passport@localhost:5433/passport?sslmode=disable" go test ./...

# Web typecheck + build
cd apps/web
npm run build

# Mobile typecheck
cd apps/mobile
npx tsc --noEmit
```

## License

MIT — see [LICENSE](LICENSE).
