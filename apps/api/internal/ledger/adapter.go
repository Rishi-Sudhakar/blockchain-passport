package ledger

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
)

// Adapter is the ledger's storage/settlement boundary. PostgresAdapter
// implements it today as a tamper-evident hash-chain in Postgres; a future
// on-chain adapter (e.g. go-ethereum against a real testnet) can implement the
// same interface with zero changes to callers in the passport/certification
// domains.
type Adapter interface {
	// Prepare computes the next record's hash-to-sign under a per-passport lock,
	// without persisting anything durable beyond a short-lived pending record.
	Prepare(ctx context.Context, passportID uuid.UUID, eventType string, payload json.RawMessage, requestedBy uuid.UUID, extraContext map[string]any) (*PendingRecord, error)

	// Commit verifies the caller's signature over the previously prepared hash
	// and, if the chain head hasn't moved since Prepare, appends the record.
	Commit(ctx context.Context, pendingID uuid.UUID, signerUserID uuid.UUID, signerAddress string, signerPublicKeyJWK json.RawMessage, signature []byte) (*Record, error)

	GetChain(ctx context.Context, passportID uuid.UUID) ([]Record, error)
	VerifyChain(ctx context.Context, passportID uuid.UUID) (*VerifyResult, error)
	Head(ctx context.Context, passportID uuid.UUID) (*Record, error)
}
