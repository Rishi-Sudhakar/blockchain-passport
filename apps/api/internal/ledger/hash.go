package ledger

import (
	"crypto/sha256"
	"fmt"
	"strconv"
	"time"

	"blockchain-passport/api/internal/cryptoutil"

	"github.com/google/uuid"
)

// GenesisHash anchors the first record of a passport's chain to a value that
// depends only on the passport's own ID, so two different passports never
// share a starting point.
func GenesisHash(passportID uuid.UUID) []byte {
	sum := sha256.Sum256([]byte("GENESIS:" + passportID.String()))
	return sum[:]
}

func PayloadHash(canonicalPayload []byte) []byte {
	sum := cryptoutil.SHA256(canonicalPayload)
	return sum[:]
}

// BuildRecordHash computes the hash a signer must sign for a given position in
// the chain. It binds the previous hash, the payload's hash, the event type,
// the passport ID and sequence number, and the signing timestamp, so any single
// tampered field changes the resulting hash.
func BuildRecordHash(prevHash, payloadHash []byte, eventType string, passportID uuid.UUID, seq int64, signedAt time.Time) []byte {
	input := fmt.Sprintf("%x|%x|%s|%s|%s|%s",
		prevHash, payloadHash, eventType, passportID.String(),
		strconv.FormatInt(seq, 10), signedAt.UTC().Format(time.RFC3339Nano))
	sum := sha256.Sum256([]byte(input))
	return sum[:]
}
