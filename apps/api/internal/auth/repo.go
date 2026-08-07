package auth

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")
var ErrExpired = errors.New("expired")

type Repo struct {
	db *pgxpool.Pool
}

func NewRepo(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

// --- WebAuthn credentials ---

func (r *Repo) SaveCredential(ctx context.Context, userID uuid.UUID, cred *webauthn.Credential, deviceLabel string) error {
	data, err := json.Marshal(cred)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(ctx,
		`INSERT INTO webauthn_credentials (user_id, credential_id, credential_data, device_label)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (credential_id) DO UPDATE SET credential_data = EXCLUDED.credential_data, updated_at = now()`,
		userID, cred.ID, data, deviceLabel)
	return err
}

func (r *Repo) UpdateCredential(ctx context.Context, cred *webauthn.Credential) error {
	data, err := json.Marshal(cred)
	if err != nil {
		return err
	}
	_, err = r.db.Exec(ctx,
		`UPDATE webauthn_credentials SET credential_data = $2, updated_at = now() WHERE credential_id = $1`,
		cred.ID, data)
	return err
}

func (r *Repo) ListCredentialsForUser(ctx context.Context, userID uuid.UUID) ([]webauthn.Credential, error) {
	rows, err := r.db.Query(ctx,
		`SELECT credential_data FROM webauthn_credentials WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var creds []webauthn.Credential
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return nil, err
		}
		var c webauthn.Credential
		if err := json.Unmarshal(raw, &c); err != nil {
			return nil, err
		}
		creds = append(creds, c)
	}
	return creds, rows.Err()
}

func (r *Repo) DeviceLabelForCredential(ctx context.Context, credentialID []byte) (string, error) {
	var label string
	err := r.db.QueryRow(ctx,
		`SELECT device_label FROM webauthn_credentials WHERE credential_id = $1`, credentialID).Scan(&label)
	return label, err
}

// --- Ceremony sessions (short-lived state between Begin*/Finish*) ---

func (r *Repo) SaveCeremonySession(ctx context.Context, kind string, userRef *uuid.UUID, session *webauthn.SessionData, ttl time.Duration) (uuid.UUID, error) {
	data, err := json.Marshal(session)
	if err != nil {
		return uuid.Nil, err
	}
	var id uuid.UUID
	err = r.db.QueryRow(ctx,
		`INSERT INTO webauthn_ceremony_sessions (kind, user_ref, challenge_data, expires_at)
		 VALUES ($1, $2, $3, $4) RETURNING id`,
		kind, userRef, data, time.Now().Add(ttl)).Scan(&id)
	return id, err
}

func (r *Repo) LoadCeremonySession(ctx context.Context, id uuid.UUID) (*webauthn.SessionData, error) {
	var data []byte
	var expiresAt time.Time
	err := r.db.QueryRow(ctx,
		`SELECT challenge_data, expires_at FROM webauthn_ceremony_sessions WHERE id = $1`, id,
	).Scan(&data, &expiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if time.Now().After(expiresAt) {
		return nil, ErrExpired
	}
	var session webauthn.SessionData
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *Repo) DeleteCeremonySession(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM webauthn_ceremony_sessions WHERE id = $1`, id)
	return err
}

// --- App sessions (post-login cookie) ---

func (r *Repo) CreateSession(ctx context.Context, token string, userID uuid.UUID, ttl time.Duration, userAgent, ip string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO sessions (token, user_id, expires_at, user_agent, ip)
		 VALUES ($1, $2, $3, $4, $5)`,
		token, userID, time.Now().Add(ttl), userAgent, ip)
	return err
}

func (r *Repo) GetSessionUserID(ctx context.Context, token string) (uuid.UUID, error) {
	var userID uuid.UUID
	var expiresAt time.Time
	err := r.db.QueryRow(ctx,
		`SELECT user_id, expires_at FROM sessions WHERE token = $1`, token,
	).Scan(&userID, &expiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, ErrNotFound
	}
	if err != nil {
		return uuid.Nil, err
	}
	if time.Now().After(expiresAt) {
		return uuid.Nil, ErrExpired
	}
	return userID, nil
}

func (r *Repo) DeleteSession(ctx context.Context, token string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM sessions WHERE token = $1`, token)
	return err
}

// --- Device pairing (secondary-device sign-in by code) ---

func (r *Repo) CreatePairingCode(ctx context.Context, code string, userID uuid.UUID, ttl time.Duration) (time.Time, error) {
	expiresAt := time.Now().Add(ttl)
	_, err := r.db.Exec(ctx,
		`INSERT INTO device_pairing_codes (code, user_id, expires_at) VALUES ($1, $2, $3)`,
		code, userID, expiresAt)
	return expiresAt, err
}

// RedeemPairingCode atomically marks a pairing code consumed and returns the
// user it belongs to, or ErrNotFound/ErrExpired if it can't be redeemed.
func (r *Repo) RedeemPairingCode(ctx context.Context, code string) (uuid.UUID, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback(ctx)

	var userID uuid.UUID
	var expiresAt time.Time
	var consumedAt *time.Time
	err = tx.QueryRow(ctx,
		`SELECT user_id, expires_at, consumed_at FROM device_pairing_codes WHERE code = $1 FOR UPDATE`, code,
	).Scan(&userID, &expiresAt, &consumedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, ErrNotFound
	}
	if err != nil {
		return uuid.Nil, err
	}
	if consumedAt != nil || time.Now().After(expiresAt) {
		return uuid.Nil, ErrExpired
	}

	if _, err := tx.Exec(ctx, `UPDATE device_pairing_codes SET consumed_at = now() WHERE code = $1`, code); err != nil {
		return uuid.Nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, err
	}
	return userID, nil
}
