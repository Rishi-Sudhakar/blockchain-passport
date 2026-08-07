package passport

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("passport: not found")

type Repo struct {
	db *pgxpool.Pool
}

func NewRepo(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

const publicCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I ambiguity

func generatePublicCode() (string, error) {
	buf := make([]byte, 10)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	var sb strings.Builder
	sb.WriteString("BP-")
	for i, b := range buf {
		if i == 5 {
			sb.WriteByte('-')
		}
		sb.WriteByte(publicCodeAlphabet[int(b)%len(publicCodeAlphabet)])
	}
	return sb.String(), nil
}

func (r *Repo) CreatePassport(ctx context.Context, orgID, createdBy uuid.UUID, category string) (*Passport, error) {
	var p Passport
	for attempt := 0; attempt < 5; attempt++ {
		code, err := generatePublicCode()
		if err != nil {
			return nil, err
		}
		err = r.db.QueryRow(ctx,
			`INSERT INTO passports (public_code, category, organization_id, created_by)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, public_code, category, status, organization_id, current_version_id, created_by, created_at, updated_at`,
			code, category, orgID, createdBy,
		).Scan(&p.ID, &p.PublicCode, &p.Category, &p.Status, &p.OrganizationID, &p.CurrentVersionID, &p.CreatedBy, &p.CreatedAt, &p.UpdatedAt)
		if err == nil {
			return &p, nil
		}
		if !strings.Contains(err.Error(), "duplicate key") {
			return nil, err
		}
	}
	return nil, fmt.Errorf("passport: failed to allocate a unique public code")
}

func (r *Repo) GetPassport(ctx context.Context, id uuid.UUID) (*Passport, error) {
	return r.scanPassport(r.db.QueryRow(ctx,
		`SELECT id, public_code, category, status, organization_id, current_version_id, created_by, created_at, updated_at
		 FROM passports WHERE id = $1`, id))
}

// GetPassportByPublicCode matches case-insensitively: a human retyping a code
// off a physical label, or a QR scanner returning it in a different case,
// shouldn't produce a false "not found" for what is otherwise a valid code.
func (r *Repo) GetPassportByPublicCode(ctx context.Context, code string) (*Passport, error) {
	return r.scanPassport(r.db.QueryRow(ctx,
		`SELECT id, public_code, category, status, organization_id, current_version_id, created_by, created_at, updated_at
		 FROM passports WHERE upper(public_code) = upper($1)`, code))
}

func (r *Repo) scanPassport(row pgx.Row) (*Passport, error) {
	var p Passport
	err := row.Scan(&p.ID, &p.PublicCode, &p.Category, &p.Status, &p.OrganizationID, &p.CurrentVersionID, &p.CreatedBy, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repo) ListByOrganization(ctx context.Context, orgID uuid.UUID) ([]Passport, error) {
	return r.list(ctx, `WHERE organization_id = $1 ORDER BY updated_at DESC`, orgID)
}

func (r *Repo) ListByStatus(ctx context.Context, status Status) ([]Passport, error) {
	return r.list(ctx, `WHERE status = $1 ORDER BY updated_at ASC`, status)
}

func (r *Repo) ListAll(ctx context.Context) ([]Passport, error) {
	return r.list(ctx, `ORDER BY updated_at DESC`)
}

func (r *Repo) list(ctx context.Context, where string, args ...any) ([]Passport, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, public_code, category, status, organization_id, current_version_id, created_by, created_at, updated_at
		 FROM passports `+where, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Passport
	for rows.Next() {
		var p Passport
		if err := rows.Scan(&p.ID, &p.PublicCode, &p.Category, &p.Status, &p.OrganizationID, &p.CurrentVersionID, &p.CreatedBy, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *Repo) UpdateStatus(ctx context.Context, id uuid.UUID, status Status) error {
	_, err := r.db.Exec(ctx, `UPDATE passports SET status = $2, updated_at = now() WHERE id = $1`, id, status)
	return err
}

func (r *Repo) SetCurrentVersion(ctx context.Context, id, versionID uuid.UUID, status Status) error {
	_, err := r.db.Exec(ctx,
		`UPDATE passports SET current_version_id = $2, status = $3, updated_at = now() WHERE id = $1`,
		id, versionID, status)
	return err
}

// --- Versions ---

func (r *Repo) UpsertDraftVersion(ctx context.Context, passportID, createdBy uuid.UUID, data json.RawMessage) (*Version, error) {
	var v Version
	err := r.db.QueryRow(ctx,
		`INSERT INTO passport_versions (passport_id, version_number, status_at_version, data, created_by)
		 VALUES ($1, 1, 'draft', $2, $3)
		 ON CONFLICT (passport_id, version_number) DO UPDATE SET data = EXCLUDED.data
		 RETURNING id, passport_id, version_number, status_at_version, data, created_by, ledger_record_id, created_at`,
		passportID, data, createdBy,
	).Scan(&v.ID, &v.PassportID, &v.VersionNumber, &v.StatusAtVersion, &v.Data, &v.CreatedBy, &v.LedgerRecordID, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *Repo) CreateVersion(ctx context.Context, passportID, createdBy uuid.UUID, statusAtVersion Status, data json.RawMessage, ledgerRecordID uuid.UUID) (*Version, error) {
	var nextNum int
	err := r.db.QueryRow(ctx,
		`SELECT COALESCE(MAX(version_number), 0) + 1 FROM passport_versions WHERE passport_id = $1`, passportID,
	).Scan(&nextNum)
	if err != nil {
		return nil, err
	}

	var v Version
	err = r.db.QueryRow(ctx,
		`INSERT INTO passport_versions (passport_id, version_number, status_at_version, data, created_by, ledger_record_id)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, passport_id, version_number, status_at_version, data, created_by, ledger_record_id, created_at`,
		passportID, nextNum, statusAtVersion, data, createdBy, ledgerRecordID,
	).Scan(&v.ID, &v.PassportID, &v.VersionNumber, &v.StatusAtVersion, &v.Data, &v.CreatedBy, &v.LedgerRecordID, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *Repo) GetVersion(ctx context.Context, id uuid.UUID) (*Version, error) {
	var v Version
	err := r.db.QueryRow(ctx,
		`SELECT id, passport_id, version_number, status_at_version, data, created_by, ledger_record_id, created_at
		 FROM passport_versions WHERE id = $1`, id,
	).Scan(&v.ID, &v.PassportID, &v.VersionNumber, &v.StatusAtVersion, &v.Data, &v.CreatedBy, &v.LedgerRecordID, &v.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *Repo) ListVersions(ctx context.Context, passportID uuid.UUID) ([]Version, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, passport_id, version_number, status_at_version, data, created_by, ledger_record_id, created_at
		 FROM passport_versions WHERE passport_id = $1 ORDER BY version_number ASC`, passportID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Version
	for rows.Next() {
		var v Version
		if err := rows.Scan(&v.ID, &v.PassportID, &v.VersionNumber, &v.StatusAtVersion, &v.Data, &v.CreatedBy, &v.LedgerRecordID, &v.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	return out, rows.Err()
}
