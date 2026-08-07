package passport

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"

	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/ledger"

	"github.com/google/uuid"
)

var (
	ErrForbidden         = errors.New("passport: forbidden")
	ErrInvalidTransition = errors.New("passport: invalid state transition")
	ErrUnsupportedEvent  = errors.New("passport: unsupported event type for this endpoint")
)

type Service struct {
	repo        *Repo
	ledger      ledger.Adapter
	identity    *identity.Repo
	onSubmitted func(ctx context.Context, passportID, versionID uuid.UUID) error
}

func NewService(repo *Repo, ledgerAdapter ledger.Adapter, identityRepo *identity.Repo) *Service {
	return &Service{repo: repo, ledger: ledgerAdapter, identity: identityRepo}
}

// SetOnSubmitted registers a hook invoked after a passport is successfully
// submitted (e.g. certification.Service.OnPassportSubmitted, which opens the
// certifier queue entry). Kept as a callback rather than a direct dependency
// so passport does not need to import certification.
func (s *Service) SetOnSubmitted(fn func(ctx context.Context, passportID, versionID uuid.UUID) error) {
	s.onSubmitted = fn
}

func sameOrg(user *identity.User, orgID uuid.UUID) bool {
	return user.OrganizationID != nil && *user.OrganizationID == orgID
}

func (s *Service) CreateDraft(ctx context.Context, user *identity.User, category string, data json.RawMessage) (*Passport, *Version, error) {
	if user.OrganizationID == nil {
		return nil, nil, ErrForbidden
	}
	p, err := s.repo.CreatePassport(ctx, *user.OrganizationID, user.ID, category)
	if err != nil {
		return nil, nil, err
	}
	v, err := s.repo.UpsertDraftVersion(ctx, p.ID, user.ID, data)
	if err != nil {
		return nil, nil, err
	}
	return p, v, nil
}

func (s *Service) UpdateDraft(ctx context.Context, user *identity.User, passportID uuid.UUID, data json.RawMessage) (*Version, error) {
	p, err := s.repo.GetPassport(ctx, passportID)
	if err != nil {
		return nil, err
	}
	if !sameOrg(user, p.OrganizationID) {
		return nil, ErrForbidden
	}
	if p.Status != StatusDraft {
		return nil, ErrInvalidTransition
	}
	return s.repo.UpsertDraftVersion(ctx, passportID, user.ID, data)
}

func (s *Service) Get(ctx context.Context, user *identity.User, passportID uuid.UUID) (*Passport, error) {
	p, err := s.repo.GetPassport(ctx, passportID)
	if err != nil {
		return nil, err
	}
	if !s.canView(user, p) {
		return nil, ErrForbidden
	}
	return p, nil
}

func (s *Service) canView(user *identity.User, p *Passport) bool {
	if user.Role == identity.RoleAdmin || user.Role == identity.RoleCertifier {
		return true
	}
	return sameOrg(user, p.OrganizationID)
}

// ListVisible mirrors canView's rules at list scope: certifiers and admins
// aren't scoped to an organization, so without this they'd see an empty list
// the moment a passport they certified left the pending queue — there'd be no
// way for them to ever find it again. Manufacturers still only see their own
// organization's passports.
func (s *Service) ListVisible(ctx context.Context, user *identity.User) ([]Passport, error) {
	if user.Role == identity.RoleAdmin || user.Role == identity.RoleCertifier {
		return s.repo.ListAll(ctx)
	}
	if user.OrganizationID == nil {
		return nil, nil
	}
	return s.repo.ListByOrganization(ctx, *user.OrganizationID)
}

func (s *Service) ListVersions(ctx context.Context, user *identity.User, passportID uuid.UUID) ([]Version, error) {
	if _, err := s.Get(ctx, user, passportID); err != nil {
		return nil, err
	}
	return s.repo.ListVersions(ctx, passportID)
}

func (s *Service) GetChain(ctx context.Context, user *identity.User, passportID uuid.UUID) ([]ledger.Record, error) {
	if _, err := s.Get(ctx, user, passportID); err != nil {
		return nil, err
	}
	return s.ledger.GetChain(ctx, passportID)
}

func (s *Service) VerifyChain(ctx context.Context, passportID uuid.UUID) (*ledger.VerifyResult, error) {
	return s.ledger.VerifyChain(ctx, passportID)
}

// GetPublic and GetChainPublic back the no-auth /public verification
// endpoints: anyone with a passport's public code (typically via QR scan) can
// see its compliance data and chain of custody without an account.
func (s *Service) GetPublic(ctx context.Context, publicCode string) (*Passport, []Version, error) {
	p, err := s.repo.GetPassportByPublicCode(ctx, publicCode)
	if err != nil {
		return nil, nil, err
	}
	versions, err := s.repo.ListVersions(ctx, p.ID)
	if err != nil {
		return nil, nil, err
	}
	return p, versions, nil
}

func (s *Service) GetChainPublic(ctx context.Context, publicCode string) ([]ledger.Record, error) {
	p, err := s.repo.GetPassportByPublicCode(ctx, publicCode)
	if err != nil {
		return nil, err
	}
	return s.ledger.GetChain(ctx, p.ID)
}

// PrepareTransition validates the requested event is legal for the passport's
// current state and org ownership, then asks the ledger for a hash to sign.
func (s *Service) PrepareTransition(ctx context.Context, user *identity.User, passportID uuid.UUID, eventType string, data json.RawMessage) (*ledger.PendingRecord, error) {
	p, err := s.repo.GetPassport(ctx, passportID)
	if err != nil {
		return nil, err
	}
	if !sameOrg(user, p.OrganizationID) {
		return nil, ErrForbidden
	}

	switch eventType {
	case EventSubmit:
		if p.Status != StatusDraft {
			return nil, ErrInvalidTransition
		}
	case EventAmend:
		if p.Status != StatusPublished && p.Status != StatusAmended {
			return nil, ErrInvalidTransition
		}
	case EventPublish:
		if p.Status != StatusCertified {
			return nil, ErrInvalidTransition
		}
	case EventEndOfLife:
		if p.Status != StatusPublished && p.Status != StatusAmended {
			return nil, ErrInvalidTransition
		}
	default:
		return nil, ErrUnsupportedEvent
	}

	return s.ledger.Prepare(ctx, passportID, eventType, data, user.ID, nil)
}

// CommitTransition verifies the client's signature over the previously
// prepared hash, appends the ledger record, and applies the corresponding
// domain-table update.
func (s *Service) CommitTransition(ctx context.Context, user *identity.User, pendingID uuid.UUID, signerAddress string, signature []byte) (*ledger.Record, *Passport, error) {
	key, err := s.identity.ResolveActiveSigningKey(ctx, user.ID, signerAddress)
	if err != nil {
		return nil, nil, ErrForbidden
	}

	record, err := s.ledger.Commit(ctx, pendingID, user.ID, signerAddress, key.PublicKeyJWK, signature)
	if err != nil {
		return nil, nil, err
	}

	switch record.EventType {
	case EventSubmit:
		v, err := s.repo.CreateVersion(ctx, record.PassportID, user.ID, StatusSubmitted, record.Payload, record.ID)
		if err != nil {
			return nil, nil, err
		}
		if err := s.repo.SetCurrentVersion(ctx, record.PassportID, v.ID, StatusSubmitted); err != nil {
			return nil, nil, err
		}
		if s.onSubmitted != nil {
			if err := s.onSubmitted(ctx, record.PassportID, v.ID); err != nil {
				slog.Error("onSubmitted hook failed", "passportId", record.PassportID, "err", err)
			}
		}
	case EventAmend:
		v, err := s.repo.CreateVersion(ctx, record.PassportID, user.ID, StatusAmended, record.Payload, record.ID)
		if err != nil {
			return nil, nil, err
		}
		if err := s.repo.SetCurrentVersion(ctx, record.PassportID, v.ID, StatusAmended); err != nil {
			return nil, nil, err
		}
	case EventPublish:
		if err := s.repo.UpdateStatus(ctx, record.PassportID, StatusPublished); err != nil {
			return nil, nil, err
		}
	case EventEndOfLife:
		if err := s.repo.UpdateStatus(ctx, record.PassportID, StatusEndOfLife); err != nil {
			return nil, nil, err
		}
	}

	p, err := s.repo.GetPassport(ctx, record.PassportID)
	if err != nil {
		return nil, nil, err
	}
	return record, p, nil
}
