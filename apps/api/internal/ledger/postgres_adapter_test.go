package ledger_test

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"os"
	"testing"

	"blockchain-passport/api/internal/cryptoutil"
	"blockchain-passport/api/internal/ledger"
	"blockchain-passport/api/internal/platform"

	"github.com/google/uuid"
)

// This is an integration test against a real Postgres (the schema from
// internal/migrations must already be applied). It's skipped automatically
// when DATABASE_URL isn't set, e.g. in environments with no database.
func TestLedgerPrepareCommitAndVerifyDetectsTamper(t *testing.T) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL not set, skipping ledger integration test")
	}
	ctx := context.Background()
	pool, err := platform.NewPool(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer pool.Close()

	// Minimal fixtures: an org and a user, referenced by passports/ledger_records.
	var orgID uuid.UUID
	if err := pool.QueryRow(ctx,
		`INSERT INTO organizations (name) VALUES ('Test Org') RETURNING id`,
	).Scan(&orgID); err != nil {
		t.Fatalf("insert org: %v", err)
	}

	handle := make([]byte, 64)
	_, _ = rand.Read(handle)
	var userID uuid.UUID
	if err := pool.QueryRow(ctx,
		`INSERT INTO users (email, display_name, role, organization_id, webauthn_user_handle)
		 VALUES ($1, 'Test User', 'manufacturer', $2, $3) RETURNING id`,
		uuid.NewString()+"@example.test", orgID, handle,
	).Scan(&userID); err != nil {
		t.Fatalf("insert user: %v", err)
	}

	var passportID uuid.UUID
	if err := pool.QueryRow(ctx,
		`INSERT INTO passports (public_code, organization_id, created_by) VALUES ($1, $2, $3) RETURNING id`,
		"BP-TEST-"+uuid.NewString()[:8], orgID, userID,
	).Scan(&passportID); err != nil {
		t.Fatalf("insert passport: %v", err)
	}

	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	jwk, _ := json.Marshal(map[string]string{
		"kty": "EC",
		"crv": "P-256",
		"x":   base64.RawURLEncoding.EncodeToString(priv.X.FillBytes(make([]byte, 32))),
		"y":   base64.RawURLEncoding.EncodeToString(priv.Y.FillBytes(make([]byte, 32))),
	})
	canonicalJWK, err := cryptoutil.CanonicalJSON(jwk)
	if err != nil {
		t.Fatalf("canonicalize jwk: %v", err)
	}
	address := cryptoutil.DeriveAddress(canonicalJWK)

	adapter := ledger.NewPostgresAdapter(pool)
	// Mirrors crypto.subtle.sign({name:"ECDSA", hash:"SHA-256"}, ...): the
	// browser hashes `message` internally before signing, so the test must too.
	sign := func(message []byte) []byte {
		digest := sha256.Sum256(message)
		r, s, err := ecdsa.Sign(rand.Reader, priv, digest[:])
		if err != nil {
			t.Fatalf("sign: %v", err)
		}
		out := make([]byte, 64)
		r.FillBytes(out[:32])
		s.FillBytes(out[32:])
		return out
	}

	appendRecord := func(eventType string, payload string) *ledger.Record {
		pending, err := adapter.Prepare(ctx, passportID, eventType, json.RawMessage(payload), userID, nil)
		if err != nil {
			t.Fatalf("prepare %s: %v", eventType, err)
		}
		sig := sign(pending.RecordHashToSign)
		rec, err := adapter.Commit(ctx, pending.ID, userID, address, jwk, sig)
		if err != nil {
			t.Fatalf("commit %s: %v", eventType, err)
		}
		return rec
	}

	rec1 := appendRecord("submit", `{"battery":"NMC","capacityAh":75}`)
	if rec1.SequenceNum != 1 {
		t.Fatalf("expected first record to have sequence 1, got %d", rec1.SequenceNum)
	}
	rec2 := appendRecord("amend", `{"battery":"NMC","capacityAh":80}`)
	if rec2.SequenceNum != 2 {
		t.Fatalf("expected second record to have sequence 2, got %d", rec2.SequenceNum)
	}

	result, err := adapter.VerifyChain(ctx, passportID)
	if err != nil {
		t.Fatalf("verify chain: %v", err)
	}
	if !result.Valid || result.Length != 2 {
		t.Fatalf("expected a valid 2-record chain, got %+v", result)
	}

	// Tamper directly in the DB, bypassing the API, and confirm VerifyChain catches it.
	if _, err := pool.Exec(ctx,
		`UPDATE ledger_records SET payload = $1 WHERE passport_id = $2 AND sequence_num = 1`,
		[]byte(`{"battery":"NMC","capacityAh":9999}`), passportID,
	); err != nil {
		t.Fatalf("tamper update: %v", err)
	}

	tamperedResult, err := adapter.VerifyChain(ctx, passportID)
	if err != nil {
		t.Fatalf("verify chain after tamper: %v", err)
	}
	if tamperedResult.Valid {
		t.Fatal("expected tampered chain to be flagged invalid")
	}
	if tamperedResult.BrokenAt == nil || *tamperedResult.BrokenAt != 1 {
		t.Fatalf("expected tamper to be detected at sequence 1, got %+v", tamperedResult)
	}
}
