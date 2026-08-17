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

### Web — manufacturer

<table>
<tr>
<td width="33%"><img src="docs/screenshots/web/01-landing.png" width="100%"><br><sub><b>Landing page</b></sub></td>
<td width="33%"><img src="docs/screenshots/web/02-manufacturer-dashboard.png" width="100%"><br><sub><b>Dashboard</b></sub></td>
<td width="33%"><img src="docs/screenshots/web/03-new-passport-wizard.png" width="100%"><br><sub><b>New passport wizard</b></sub></td>
</tr>
<tr>
<td width="33%"><img src="docs/screenshots/web/04-published-passport-actions.png" width="100%"><br><sub><b>Published passport — amend or retire</b></sub></td>
<td width="33%"><img src="docs/screenshots/web/05-manufacturer-profile-pairing.png" width="100%"><br><sub><b>Profile — pair the mobile app</b></sub></td>
<td width="33%"></td>
</tr>
</table>

### Web — certifier

An end-to-end approval, screenshotted live: review a submission, read its compliance data,
check the chain of custody before approving, then approve and watch the chain grow a new
signed record.

<table>
<tr>
<td width="25%"><img src="docs/screenshots/web/06-passport-list-certifier.png" width="100%"><br><sub><b>1. Passport list</b></sub></td>
<td width="25%"><img src="docs/screenshots/web/07-certifier-review.png" width="100%"><br><sub><b>2. Review — approve or reject</b></sub></td>
<td width="25%"><img src="docs/screenshots/web/08-compliance-data.png" width="100%"><br><sub><b>3. Compliance data</b></sub></td>
<td width="25%"><img src="docs/screenshots/web/09-chain-before-approval.png" width="100%"><br><sub><b>4. Chain — before approval</b></sub></td>
</tr>
</table>

<table>
<tr>
<td width="25%"><img src="docs/screenshots/web/10-chain-after-approval.png" width="100%"><br><sub><b>5. Chain — after approval</b></sub></td>
<td width="25%"><img src="docs/screenshots/web/11-certified-passport-qr.png" width="100%"><br><sub><b>6. Certified passport — QR</b></sub></td>
<td width="25%"><img src="docs/screenshots/web/12-certifier-profile-pairing.png" width="100%"><br><sub><b>7. Profile — pair the mobile app</b></sub></td>
<td width="25%"></td>
</tr>
</table>

### Mobile — manufacturer

<table>
<tr>
<td width="20%"><img src="docs/screenshots/mobile/01-manufacturer-dashboard.png" width="100%"><br><sub><b>Dashboard</b></sub></td>
<td width="20%"><img src="docs/screenshots/mobile/02-new-passport-wizard.png" width="100%"><br><sub><b>New passport wizard</b></sub></td>
<td width="20%"><img src="docs/screenshots/mobile/03-publish-passport.png" width="100%"><br><sub><b>Publish a certified passport</b></sub></td>
<td width="20%"><img src="docs/screenshots/mobile/04-published-passport-actions.png" width="100%"><br><sub><b>Amend or retire</b></sub></td>
<td width="20%"><img src="docs/screenshots/mobile/05-manufacturer-profile-pairing.png" width="100%"><br><sub><b>Profile — pair this device</b></sub></td>
</tr>
</table>

### Mobile — certifier

<table>
<tr>
<td width="25%"><img src="docs/screenshots/mobile/06-certifier-dashboard.png" width="100%"><br><sub><b>Dashboard</b></sub></td>
<td width="25%"><img src="docs/screenshots/mobile/07-certification-queue.png" width="100%"><br><sub><b>Certification queue</b></sub></td>
<td width="25%"><img src="docs/screenshots/mobile/08-certified-passport-certifier-view.png" width="100%"><br><sub><b>Certified passport</b></sub></td>
<td width="25%"><img src="docs/screenshots/mobile/09-certifier-profile-pairing.png" width="100%"><br><sub><b>Profile — pair this device</b></sub></td>
</tr>
</table>

### Public verification (mobile, no login)

Reached by scanning a passport's QR code directly — no account needed either way.

<table>
<tr>
<td width="50%"><img src="docs/screenshots/mobile/10-public-verify-integrity.png" width="100%"><br><sub><b>Chain integrity result</b></sub></td>
<td width="50%"><img src="docs/screenshots/mobile/11-public-verify-compliance-data.png" width="100%"><br><sub><b>Full compliance data</b></sub></td>
</tr>
</table>

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
