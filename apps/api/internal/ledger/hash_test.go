package ledger

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestBuildRecordHashDeterministicAndSensitive(t *testing.T) {
	passportID := uuid.New()
	prev := GenesisHash(passportID)
	payload := PayloadHash([]byte(`{"a":1}`))
	signedAt := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	h1 := BuildRecordHash(prev, payload, "submit", passportID, 1, signedAt)
	h2 := BuildRecordHash(prev, payload, "submit", passportID, 1, signedAt)
	if string(h1) != string(h2) {
		t.Fatal("expected identical inputs to produce identical hashes")
	}

	variants := []struct {
		name string
		hash []byte
	}{
		{"different event type", BuildRecordHash(prev, payload, "amend", passportID, 1, signedAt)},
		{"different sequence", BuildRecordHash(prev, payload, "submit", passportID, 2, signedAt)},
		{"different signedAt", BuildRecordHash(prev, payload, "submit", passportID, 1, signedAt.Add(time.Second))},
		{"different payload", BuildRecordHash(prev, PayloadHash([]byte(`{"a":2}`)), "submit", passportID, 1, signedAt)},
	}
	for _, v := range variants {
		if string(v.hash) == string(h1) {
			t.Fatalf("%s: expected a different hash, got the same", v.name)
		}
	}
}

func TestGenesisHashDiffersPerPassport(t *testing.T) {
	a := GenesisHash(uuid.New())
	b := GenesisHash(uuid.New())
	if string(a) == string(b) {
		t.Fatal("expected different passports to have different genesis hashes")
	}
}
