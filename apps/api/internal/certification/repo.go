package certification

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("certification: not found")

type Repo struct {
	db *pgxpool.Pool
}

func NewRepo(db *pgxpool.Pool) *Repo {
	return &Repo{db: db}
}

func (r *Repo) Create(ctx context.Context, passportID, versionID uuid.UUID) (*Certification, error) {
	var c Certification
	err := r.db.QueryRow(ctx,
		`INSERT INTO certifications (passport_id, passport_version_id, status)
		 VALUES ($1, $2, 'pending')
		 RETURNING id, passport_id, passport_version_id, certifier_id, status, notes, reviewed_at, created_at`,
		passportID, versionID,
	).Scan(&c.ID, &c.PassportID, &c.PassportVersionID, &c.CertifierID, &c.Status, &c.Notes, &c.ReviewedAt, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repo) Get(ctx context.Context, id uuid.UUID) (*Certification, error) {
	var c Certification
	err := r.db.QueryRow(ctx,
		`SELECT id, passport_id, passport_version_id, certifier_id, status, notes, reviewed_at, created_at
		 FROM certifications WHERE id = $1`, id,
	).Scan(&c.ID, &c.PassportID, &c.PassportVersionID, &c.CertifierID, &c.Status, &c.Notes, &c.ReviewedAt, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

// PendingForPassport returns the most recent pending certification request for
// a passport, if any — used to resolve which review a certifier is acting on.
func (r *Repo) PendingForPassport(ctx context.Context, passportID uuid.UUID) (*Certification, error) {
	var c Certification
	err := r.db.QueryRow(ctx,
		`SELECT id, passport_id, passport_version_id, certifier_id, status, notes, reviewed_at, created_at
		 FROM certifications WHERE passport_id = $1 AND status = 'pending'
		 ORDER BY created_at DESC LIMIT 1`, passportID,
	).Scan(&c.ID, &c.PassportID, &c.PassportVersionID, &c.CertifierID, &c.Status, &c.Notes, &c.ReviewedAt, &c.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *Repo) Queue(ctx context.Context) ([]Certification, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, passport_id, passport_version_id, certifier_id, status, notes, reviewed_at, created_at
		 FROM certifications WHERE status = 'pending' ORDER BY created_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Certification
	for rows.Next() {
		var c Certification
		if err := rows.Scan(&c.ID, &c.PassportID, &c.PassportVersionID, &c.CertifierID, &c.Status, &c.Notes, &c.ReviewedAt, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repo) ListForPassport(ctx context.Context, passportID uuid.UUID) ([]Certification, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, passport_id, passport_version_id, certifier_id, status, notes, reviewed_at, created_at
		 FROM certifications WHERE passport_id = $1 ORDER BY created_at DESC`, passportID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Certification
	for rows.Next() {
		var c Certification
		if err := rows.Scan(&c.ID, &c.PassportID, &c.PassportVersionID, &c.CertifierID, &c.Status, &c.Notes, &c.ReviewedAt, &c.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repo) Resolve(ctx context.Context, id, certifierID uuid.UUID, status Status, notes string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE certifications SET certifier_id = $2, status = $3, notes = $4, reviewed_at = now() WHERE id = $1`,
		id, certifierID, status, notes)
	return err
}
