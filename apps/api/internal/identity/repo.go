package identity

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")

type Repo struct {
	db *pgxpool.Pool
}

func NewRepo(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

func (r *Repo) CreateOrganization(ctx context.Context, name, euRegID, country string) (*Organization, error) {
	var o Organization
	err := r.db.QueryRow(ctx,
		`INSERT INTO organizations (name, eu_registration_id, country)
		 VALUES ($1, $2, $3) RETURNING id, name, eu_registration_id, country, created_at`,
		name, euRegID, country,
	).Scan(&o.ID, &o.Name, &o.EURegistrationID, &o.Country, &o.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) GetOrganization(ctx context.Context, id uuid.UUID) (*Organization, error) {
	var o Organization
	err := r.db.QueryRow(ctx,
		`SELECT id, name, eu_registration_id, country, created_at FROM organizations WHERE id = $1`, id,
	).Scan(&o.ID, &o.Name, &o.EURegistrationID, &o.Country, &o.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) CreateUser(ctx context.Context, email, displayName string, role Role, orgID *uuid.UUID, webauthnHandle []byte) (*User, error) {
	var u User
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (email, display_name, role, organization_id, webauthn_user_handle)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, email, display_name, role, organization_id, webauthn_user_handle, created_at`,
		email, displayName, role, orgID, webauthnHandle,
	).Scan(&u.ID, &u.Email, &u.DisplayName, &u.Role, &u.OrganizationID, &u.WebAuthnUserHandle, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) GetUserByID(ctx context.Context, id uuid.UUID) (*User, error) {
	return r.scanUser(r.db.QueryRow(ctx,
		`SELECT id, email, display_name, role, organization_id, webauthn_user_handle, created_at
		 FROM users WHERE id = $1`, id))
}

func (r *Repo) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	return r.scanUser(r.db.QueryRow(ctx,
		`SELECT id, email, display_name, role, organization_id, webauthn_user_handle, created_at
		 FROM users WHERE email = $1`, email))
}

func (r *Repo) GetUserByWebAuthnHandle(ctx context.Context, handle []byte) (*User, error) {
	return r.scanUser(r.db.QueryRow(ctx,
		`SELECT id, email, display_name, role, organization_id, webauthn_user_handle, created_at
		 FROM users WHERE webauthn_user_handle = $1`, handle))
}

func (r *Repo) scanUser(row pgx.Row) (*User, error) {
	var u User
	err := row.Scan(&u.ID, &u.Email, &u.DisplayName, &u.Role, &u.OrganizationID, &u.WebAuthnUserHandle, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *Repo) CreateSigningKey(ctx context.Context, userID uuid.UUID, deviceLabel string, pubKeyJWK []byte, address string) (*SigningKey, error) {
	var k SigningKey
	err := r.db.QueryRow(ctx,
		`INSERT INTO signing_keys (user_id, device_label, public_key_jwk, address)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, user_id, device_label, public_key_jwk, address, created_at, revoked_at`,
		userID, deviceLabel, pubKeyJWK, address,
	).Scan(&k.ID, &k.UserID, &k.DeviceLabel, &k.PublicKeyJWK, &k.Address, &k.CreatedAt, &k.RevokedAt)
	if err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *Repo) ListSigningKeys(ctx context.Context, userID uuid.UUID) ([]SigningKey, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, user_id, device_label, public_key_jwk, address, created_at, revoked_at
		 FROM signing_keys WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []SigningKey
	for rows.Next() {
		var k SigningKey
		if err := rows.Scan(&k.ID, &k.UserID, &k.DeviceLabel, &k.PublicKeyJWK, &k.Address, &k.CreatedAt, &k.RevokedAt); err != nil {
			return nil, err
		}
		keys = append(keys, k)
	}
	return keys, rows.Err()
}

func (r *Repo) GetSigningKeyByAddress(ctx context.Context, address string) (*SigningKey, error) {
	var k SigningKey
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, device_label, public_key_jwk, address, created_at, revoked_at
		 FROM signing_keys WHERE address = $1`, address,
	).Scan(&k.ID, &k.UserID, &k.DeviceLabel, &k.PublicKeyJWK, &k.Address, &k.CreatedAt, &k.RevokedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &k, nil
}

// ResolveActiveSigningKey looks up a signing key by address and verifies it
// belongs to userID and has not been revoked. Callers (passport/certification
// commit handlers) use this to fetch the trusted public key server-side rather
// than accepting a client-supplied key blob for signature verification.
func (r *Repo) ResolveActiveSigningKey(ctx context.Context, userID uuid.UUID, address string) (*SigningKey, error) {
	key, err := r.GetSigningKeyByAddress(ctx, address)
	if err != nil {
		return nil, err
	}
	if key.UserID != userID || key.RevokedAt != nil {
		return nil, ErrNotFound
	}
	return key, nil
}

func (r *Repo) RevokeSigningKey(ctx context.Context, id, userID uuid.UUID) error {
	tag, err := r.db.Exec(ctx,
		`UPDATE signing_keys SET revoked_at = now() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL`,
		id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
