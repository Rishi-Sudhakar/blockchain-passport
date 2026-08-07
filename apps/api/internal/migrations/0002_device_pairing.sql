-- Lets an already-authenticated session (typically the web app) mint a
-- short-lived pairing code that a native client (no stable domain to scope
-- WebAuthn to) can redeem for a session of its own — the same pattern
-- "sign in on TV/desktop by entering a code" apps use.
CREATE TABLE device_pairing_codes (
    code TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
