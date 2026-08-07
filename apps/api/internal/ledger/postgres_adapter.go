package ledger

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"blockchain-passport/api/internal/cryptoutil"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const pendingTTL = 5 * time.Minute

var (
	ErrNotFound         = errors.New("ledger: not found")
	ErrPendingExpired   = errors.New("ledger: pending record expired or already consumed")
	ErrHeadMoved        = errors.New("ledger: chain head moved since prepare, retry")
	ErrInvalidSignature = errors.New("ledger: signature verification failed")
	ErrAddressMismatch  = errors.New("ledger: signer address does not match public key")
)

type PostgresAdapter struct {
	db *pgxpool.Pool
}

func NewPostgresAdapter(db *pgxpool.Pool) *PostgresAdapter {
	return &PostgresAdapter{db: db}
}

func lockPassport(ctx context.Context, tx pgx.Tx, passportID uuid.UUID) error {
	_, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1))`, passportID.String())
	return err
}

func (a *PostgresAdapter) Prepare(ctx context.Context, passportID uuid.UUID, eventType string, payload json.RawMessage, requestedBy uuid.UUID, extraContext map[string]any) (*PendingRecord, error) {
	canonicalPayload, err := cryptoutil.CanonicalJSON(payload)
	if err != nil {
		return nil, err
	}
	payloadHash := PayloadHash(canonicalPayload)

	if extraContext == nil {
		extraContext = map[string]any{}
	}
	contextJSON, err := json.Marshal(extraContext)
	if err != nil {
		return nil, err
	}

	tx, err := a.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if err := lockPassport(ctx, tx, passportID); err != nil {
		return nil, err
	}

	var headSeq int64
	var headHash []byte
	err = tx.QueryRow(ctx,
		`SELECT head_sequence_num, head_record_hash FROM ledger_heads WHERE passport_id = $1`, passportID,
	).Scan(&headSeq, &headHash)
	if errors.Is(err, pgx.ErrNoRows) {
		headSeq = 0
		headHash = GenesisHash(passportID)
	} else if err != nil {
		return nil, err
	}

	seq := headSeq + 1
	signedAt := time.Now().UTC()
	recordHash := BuildRecordHash(headHash, payloadHash, eventType, passportID, seq, signedAt)
	expiresAt := time.Now().Add(pendingTTL)

	var pendingID uuid.UUID
	err = tx.QueryRow(ctx,
		`INSERT INTO pending_ledger_records
			(passport_id, event_type, payload, payload_hash, expected_prev_hash, expected_sequence_num,
			 record_hash_to_sign, requested_by, context, signed_at, expires_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id`,
		passportID, eventType, canonicalPayload, payloadHash, headHash, seq,
		recordHash, requestedBy, contextJSON, signedAt, expiresAt,
	).Scan(&pendingID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &PendingRecord{
		ID:                  pendingID,
		PassportID:          passportID,
		EventType:           eventType,
		CanonicalPayload:    canonicalPayload,
		ExpectedPrevHash:    headHash,
		ExpectedSequenceNum: seq,
		RecordHashToSign:    recordHash,
		ExpiresAt:           expiresAt,
	}, nil
}

func (a *PostgresAdapter) Commit(ctx context.Context, pendingID uuid.UUID, signerUserID uuid.UUID, signerAddress string, signerPublicKeyJWK json.RawMessage, signature []byte) (*Record, error) {
	canonicalJWK, err := cryptoutil.CanonicalJSON(signerPublicKeyJWK)
	if err != nil {
		return nil, err
	}
	if cryptoutil.DeriveAddress(canonicalJWK) != signerAddress {
		return nil, ErrAddressMismatch
	}
	pub, err := cryptoutil.PublicKeyFromJWK(canonicalJWK)
	if err != nil {
		return nil, err
	}

	tx, err := a.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var (
		passportID                         uuid.UUID
		eventType                          string
		payload, payloadHash, expectedPrev []byte
		expectedSeq                        int64
		recordHashToSign                   []byte
		signedAt, expiresAt                time.Time
		consumedAt                         *time.Time
	)
	err = tx.QueryRow(ctx,
		`SELECT passport_id, event_type, payload, payload_hash, expected_prev_hash, expected_sequence_num,
		        record_hash_to_sign, signed_at, expires_at, consumed_at
		 FROM pending_ledger_records WHERE id = $1 FOR UPDATE`, pendingID,
	).Scan(&passportID, &eventType, &payload, &payloadHash, &expectedPrev, &expectedSeq,
		&recordHashToSign, &signedAt, &expiresAt, &consumedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if consumedAt != nil || time.Now().After(expiresAt) {
		return nil, ErrPendingExpired
	}

	if !cryptoutil.VerifyWebCryptoECDSA(pub, recordHashToSign, signature) {
		return nil, ErrInvalidSignature
	}

	if err := lockPassport(ctx, tx, passportID); err != nil {
		return nil, err
	}

	var headSeq int64
	var headHash []byte
	err = tx.QueryRow(ctx,
		`SELECT head_sequence_num, head_record_hash FROM ledger_heads WHERE passport_id = $1 FOR UPDATE`, passportID,
	).Scan(&headSeq, &headHash)
	if errors.Is(err, pgx.ErrNoRows) {
		headSeq = 0
		headHash = GenesisHash(passportID)
	} else if err != nil {
		return nil, err
	}

	if headSeq+1 != expectedSeq || string(headHash) != string(expectedPrev) {
		return nil, ErrHeadMoved
	}

	var rec Record
	err = tx.QueryRow(ctx,
		`INSERT INTO ledger_records
			(passport_id, sequence_num, event_type, payload, payload_hash, prev_hash, record_hash,
			 signer_user_id, signer_address, signer_public_key_jwk, signature, signed_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		 RETURNING id, passport_id, sequence_num, event_type, payload, payload_hash, prev_hash, record_hash,
		           signer_user_id, signer_address, signer_public_key_jwk, signature, signed_at, created_at`,
		passportID, expectedSeq, eventType, payload, payloadHash, expectedPrev, recordHashToSign,
		signerUserID, signerAddress, canonicalJWK, signature, signedAt,
	).Scan(&rec.ID, &rec.PassportID, &rec.SequenceNum, &rec.EventType, &rec.Payload, &rec.PayloadHash,
		&rec.PrevHash, &rec.RecordHash, &rec.SignerUserID, &rec.SignerAddress, &rec.SignerPublicKeyJWK,
		&rec.Signature, &rec.SignedAt, &rec.CreatedAt)
	if err != nil {
		return nil, err
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO ledger_heads (passport_id, head_sequence_num, head_record_hash)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (passport_id) DO UPDATE SET head_sequence_num = EXCLUDED.head_sequence_num,
		 	head_record_hash = EXCLUDED.head_record_hash`,
		passportID, expectedSeq, recordHashToSign)
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `UPDATE pending_ledger_records SET consumed_at = now() WHERE id = $1`, pendingID); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &rec, nil
}

func (a *PostgresAdapter) GetChain(ctx context.Context, passportID uuid.UUID) ([]Record, error) {
	rows, err := a.db.Query(ctx,
		`SELECT id, passport_id, sequence_num, event_type, payload, payload_hash, prev_hash, record_hash,
		        signer_user_id, signer_address, signer_public_key_jwk, signature, signed_at, created_at
		 FROM ledger_records WHERE passport_id = $1 ORDER BY sequence_num ASC`, passportID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []Record
	for rows.Next() {
		var rec Record
		if err := rows.Scan(&rec.ID, &rec.PassportID, &rec.SequenceNum, &rec.EventType, &rec.Payload, &rec.PayloadHash,
			&rec.PrevHash, &rec.RecordHash, &rec.SignerUserID, &rec.SignerAddress, &rec.SignerPublicKeyJWK,
			&rec.Signature, &rec.SignedAt, &rec.CreatedAt); err != nil {
			return nil, err
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}

func (a *PostgresAdapter) Head(ctx context.Context, passportID uuid.UUID) (*Record, error) {
	records, err := a.GetChain(ctx, passportID)
	if err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return nil, ErrNotFound
	}
	return &records[len(records)-1], nil
}

func (a *PostgresAdapter) VerifyChain(ctx context.Context, passportID uuid.UUID) (*VerifyResult, error) {
	records, err := a.GetChain(ctx, passportID)
	if err != nil {
		return nil, err
	}

	prevHash := GenesisHash(passportID)
	for i := range records {
		rec := &records[i]
		fail := func(reason string) (*VerifyResult, error) {
			broken := rec.SequenceNum
			return &VerifyResult{Valid: false, Length: int64(len(records)), BrokenAt: &broken, Reason: reason}, nil
		}

		payloadHash := PayloadHash(rec.Payload)
		if string(payloadHash) != string(rec.PayloadHash) {
			return fail("stored payload does not match its recorded hash")
		}
		if string(rec.PrevHash) != string(prevHash) {
			return fail("prev_hash does not match the previous record's hash")
		}
		expectedHash := BuildRecordHash(rec.PrevHash, rec.PayloadHash, rec.EventType, passportID, rec.SequenceNum, rec.SignedAt)
		if string(expectedHash) != string(rec.RecordHash) {
			return fail("record_hash does not match recomputed hash")
		}
		pub, err := cryptoutil.PublicKeyFromJWK(rec.SignerPublicKeyJWK)
		if err != nil {
			return fail("stored signer public key is invalid")
		}
		if !cryptoutil.VerifyWebCryptoECDSA(pub, rec.RecordHash, rec.Signature) {
			return fail("signature does not verify against snapshotted public key")
		}
		prevHash = rec.RecordHash
	}

	return &VerifyResult{Valid: true, Length: int64(len(records))}, nil
}
