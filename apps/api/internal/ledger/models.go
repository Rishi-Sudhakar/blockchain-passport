package ledger

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

const GenesisEventType = "genesis"

type Record struct {
	ID                 uuid.UUID       `json:"id"`
	PassportID         uuid.UUID       `json:"passportId"`
	SequenceNum        int64           `json:"sequenceNum"`
	EventType          string          `json:"eventType"`
	Payload            json.RawMessage `json:"payload"`
	PayloadHash        []byte          `json:"payloadHash"`
	PrevHash           []byte          `json:"prevHash"`
	RecordHash         []byte          `json:"recordHash"`
	SignerUserID       uuid.UUID       `json:"signerUserId"`
	SignerAddress      string          `json:"signerAddress"`
	SignerPublicKeyJWK json.RawMessage `json:"signerPublicKeyJwk"`
	Signature          []byte          `json:"signature"`
	SignedAt           time.Time       `json:"signedAt"`
	CreatedAt          time.Time       `json:"createdAt"`
}

// PendingRecord is returned by Prepare: the caller signs RecordHashToSign
// client-side and sends the signature back to Commit.
type PendingRecord struct {
	ID                  uuid.UUID       `json:"id"`
	PassportID          uuid.UUID       `json:"passportId"`
	EventType           string          `json:"eventType"`
	CanonicalPayload    json.RawMessage `json:"canonicalPayload"`
	ExpectedPrevHash    []byte          `json:"expectedPrevHash"`
	ExpectedSequenceNum int64           `json:"expectedSequenceNum"`
	RecordHashToSign    []byte          `json:"recordHashToSign"`
	ExpiresAt           time.Time       `json:"expiresAt"`
}

type VerifyResult struct {
	Valid    bool   `json:"valid"`
	Length   int64  `json:"length"`
	BrokenAt *int64 `json:"brokenAt,omitempty"`
	Reason   string `json:"reason,omitempty"`
}
