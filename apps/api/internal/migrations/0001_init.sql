-- Blockchain Passport: initial schema
-- Covers identity/auth, passport + ledger core, and certification.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('manufacturer', 'certifier', 'admin', 'consumer');
CREATE TYPE passport_status AS ENUM ('draft', 'submitted', 'certified', 'published', 'amended', 'end_of_life');
CREATE TYPE certification_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    eu_registration_id TEXT,
    country TEXT,
    contact_info JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'manufacturer',
    organization_id UUID REFERENCES organizations(id),
    webauthn_user_handle BYTEA NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- credential_data stores the full webauthn.Credential JSON (id/publicKey/flags/authenticator/attestation);
-- this follows the library's supported "opaque JSON" persistence shape rather than decomposing every
-- nested field into its own column.
CREATE TABLE webauthn_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    credential_id BYTEA NOT NULL UNIQUE,
    credential_data JSONB NOT NULL,
    device_label TEXT NOT NULL DEFAULT 'This device',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webauthn_ceremony_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL, -- 'register' | 'login'
    user_ref UUID, -- nullable: unknown until login ceremony resolves credential
    challenge_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE signing_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_label TEXT NOT NULL DEFAULT 'This device',
    public_key_jwk JSONB NOT NULL,
    address TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'battery',
    status passport_status NOT NULL DEFAULT 'draft',
    organization_id UUID NOT NULL REFERENCES organizations(id),
    current_version_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE passport_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    status_at_version passport_status NOT NULL,
    data JSONB NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    ledger_record_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (passport_id, version_number)
);

ALTER TABLE passports
    ADD CONSTRAINT fk_passports_current_version
    FOREIGN KEY (current_version_id) REFERENCES passport_versions(id);

CREATE TABLE ledger_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
    sequence_num BIGINT NOT NULL,
    event_type TEXT NOT NULL,
    -- `json`, not `jsonb`: jsonb reformats on storage (key order, whitespace),
    -- which would break byte-exact re-hashing during VerifyChain.
    payload JSON NOT NULL,
    payload_hash BYTEA NOT NULL,
    prev_hash BYTEA NOT NULL,
    record_hash BYTEA NOT NULL UNIQUE,
    signer_user_id UUID NOT NULL REFERENCES users(id),
    signer_address TEXT NOT NULL,
    signer_public_key_jwk JSONB NOT NULL,
    signature BYTEA NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (passport_id, sequence_num)
);

CREATE TABLE ledger_heads (
    passport_id UUID PRIMARY KEY REFERENCES passports(id) ON DELETE CASCADE,
    head_sequence_num BIGINT NOT NULL DEFAULT 0,
    head_record_hash BYTEA NOT NULL
);

CREATE TABLE pending_ledger_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSON NOT NULL,
    payload_hash BYTEA NOT NULL,
    expected_prev_hash BYTEA NOT NULL,
    expected_sequence_num BIGINT NOT NULL,
    record_hash_to_sign BYTEA NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    context JSONB NOT NULL DEFAULT '{}', -- handler-specific extra data (e.g. target status, certification note)
    signed_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    passport_id UUID NOT NULL REFERENCES passports(id) ON DELETE CASCADE,
    passport_version_id UUID NOT NULL REFERENCES passport_versions(id),
    certifier_id UUID REFERENCES users(id),
    status certification_status NOT NULL DEFAULT 'pending',
    notes TEXT NOT NULL DEFAULT '',
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_passports_org ON passports(organization_id);
CREATE INDEX idx_passports_status ON passports(status);
CREATE INDEX idx_passport_versions_passport ON passport_versions(passport_id);
CREATE INDEX idx_ledger_records_passport ON ledger_records(passport_id, sequence_num);
CREATE INDEX idx_certifications_passport ON certifications(passport_id);
CREATE INDEX idx_certifications_status ON certifications(status);
CREATE INDEX idx_pending_ledger_passport ON pending_ledger_records(passport_id);
