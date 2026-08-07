package certification

import (
	"context"
	"encoding/json"
	"errors"

	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/ledger"
	"blockchain-passport/api/internal/passport"

	"github.com/google/uuid"
)

var (
	ErrForbidden         = errors.New("certification: forbidden")
	ErrInvalidTransition = errors.New("certification: invalid state transition")
	ErrNoPendingRequest  = errors.New("certification: no pending certification request for this passport")
)

type Service struct {
	repo      *Repo
	passports *passport.Repo
	ledger    ledger.Adapter
	identity  *identity.Repo
}

func NewService(repo *Repo, passports *passport.Repo, ledgerAdapter ledger.Adapter, identityRepo *identity.Repo) *Service {
	return &Service{repo: repo, passports: passports, ledger: ledgerAdapter, identity: identityRepo}
}

// OnPassportSubmitted is wired as passport.Service's post-submit hook: every
// time a passport moves to "submitted", a pending certification request is
// opened so it shows up in the certifier queue.
func (s *Service) OnPassportSubmitted(ctx context.Context, passportID, versionID uuid.UUID) error {
	_, err := s.repo.Create(ctx, passportID, versionID)
	return err
}

func requireCertifier(user *identity.User) error {
	if user.Role != identity.RoleCertifier && user.Role != identity.RoleAdmin {
		return ErrForbidden
	}
	return nil
}

type QueueItem struct {
	Certification Certification      `json:"certification"`
	Passport      *passport.Passport `json:"passport"`
}

func (s *Service) Queue(ctx context.Context, user *identity.User) ([]QueueItem, error) {
	if err := requireCertifier(user); err != nil {
		return nil, err
	}
	pending, err := s.repo.Queue(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]QueueItem, 0, len(pending))
	for _, c := range pending {
		p, err := s.passports.GetPassport(ctx, c.PassportID)
		if err != nil {
			continue
		}
		items = append(items, QueueItem{Certification: c, Passport: p})
	}
	return items, nil
}

func (s *Service) ListForPassport(ctx context.Context, passportID uuid.UUID) ([]Certification, error) {
	return s.repo.ListForPassport(ctx, passportID)
}

type decisionPayload struct {
	Notes           string    `json:"notes"`
	CertificationID uuid.UUID `json:"certificationId"`
}

// PrepareDecision validates that a certifier may approve/reject the passport's
// pending certification request, then asks the ledger for a hash to sign.
func (s *Service) PrepareDecision(ctx context.Context, user *identity.User, passportID uuid.UUID, approve bool, notes string) (*ledger.PendingRecord, error) {
	if err := requireCertifier(user); err != nil {
		return nil, err
	}
	p, err := s.passports.GetPassport(ctx, passportID)
	if err != nil {
		return nil, err
	}
	if p.Status != passport.StatusSubmitted {
		return nil, ErrInvalidTransition
	}
	cert, err := s.repo.PendingForPassport(ctx, passportID)
	if err != nil {
		return nil, ErrNoPendingRequest
	}

	eventType := passport.EventCertifyApprove
	if !approve {
		eventType = passport.EventCertifyReject
	}
	payload, err := json.Marshal(decisionPayload{Notes: notes, CertificationID: cert.ID})
	if err != nil {
		return nil, err
	}
	return s.ledger.Prepare(ctx, passportID, eventType, payload, user.ID, nil)
}

// CommitDecision verifies the certifier's signature, appends the ledger
// record, resolves the certification request, and moves the passport to
// "certified" (approved) or back to "draft" (rejected, for revision).
func (s *Service) CommitDecision(ctx context.Context, user *identity.User, pendingID uuid.UUID, signerAddress string, signature []byte) (*ledger.Record, *passport.Passport, error) {
	key, err := s.identity.ResolveActiveSigningKey(ctx, user.ID, signerAddress)
	if err != nil {
		return nil, nil, ErrForbidden
	}

	record, err := s.ledger.Commit(ctx, pendingID, user.ID, signerAddress, key.PublicKeyJWK, signature)
	if err != nil {
		return nil, nil, err
	}

	var decision decisionPayload
	if err := json.Unmarshal(record.Payload, &decision); err != nil {
		return nil, nil, err
	}

	switch record.EventType {
	case passport.EventCertifyApprove:
		if err := s.repo.Resolve(ctx, decision.CertificationID, user.ID, StatusApproved, decision.Notes); err != nil {
			return nil, nil, err
		}
		if err := s.passports.UpdateStatus(ctx, record.PassportID, passport.StatusCertified); err != nil {
			return nil, nil, err
		}
	case passport.EventCertifyReject:
		if err := s.repo.Resolve(ctx, decision.CertificationID, user.ID, StatusRejected, decision.Notes); err != nil {
			return nil, nil, err
		}
		if err := s.passports.UpdateStatus(ctx, record.PassportID, passport.StatusDraft); err != nil {
			return nil, nil, err
		}
	}

	p, err := s.passports.GetPassport(ctx, record.PassportID)
	if err != nil {
		return nil, nil, err
	}
	return record, p, nil
}
