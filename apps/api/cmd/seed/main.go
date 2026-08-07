// cmd/seed populates the database with realistic mock battery passports
// spanning every lifecycle status, signed through the real ledger
// prepare/commit flow (not faked rows) so the resulting chain-of-custody is
// genuinely verifiable. Attaches to the manufacturer/certifier accounts
// already used for manual testing, found by email, so the data shows up
// immediately when logging in as either.
package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"

	"blockchain-passport/api/internal/certification"
	"blockchain-passport/api/internal/cryptoutil"
	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/ledger"
	"blockchain-passport/api/internal/passport"
	"blockchain-passport/api/internal/platform"

	"github.com/google/uuid"
)

const (
	manufacturerEmail = "test@abc.com"
	certifierEmail    = "abc@test.com"
)

func main() {
	ctx := context.Background()
	cfg := platform.LoadConfig()

	pool, err := platform.NewPool(ctx, cfg.DatabaseURL)
	must(err)
	defer pool.Close()

	identityRepo := identity.NewRepo(pool)
	passportRepo := passport.NewRepo(pool)
	certRepo := certification.NewRepo(pool)
	ledgerAdapter := ledger.NewPostgresAdapter(pool)

	passportSvc := passport.NewService(passportRepo, ledgerAdapter, identityRepo)
	certSvc := certification.NewService(certRepo, passportRepo, ledgerAdapter, identityRepo)
	passportSvc.SetOnSubmitted(certSvc.OnPassportSubmitted)

	mfgUser, err := identityRepo.GetUserByEmail(ctx, manufacturerEmail)
	must(err)
	certUser, err := identityRepo.GetUserByEmail(ctx, certifierEmail)
	must(err)
	slog.Info("seeding as", "manufacturer", mfgUser.Email, "certifier", certUser.Email)

	mfgSigner := newSeedSigner(ctx, identityRepo, mfgUser.ID, "Seed Script (manufacturer)")
	certSigner := newSeedSigner(ctx, identityRepo, certUser.ID, "Seed Script (certifier)")

	for _, spec := range specs {
		if err := spec.run(ctx, passportSvc, certSvc, mfgUser, certUser, mfgSigner, certSigner); err != nil {
			slog.Error("seed spec failed", "model", spec.data.ProductIdentifier.BatteryModel, "err", err)
			os.Exit(1)
		}
		slog.Info("seeded", "model", spec.data.ProductIdentifier.BatteryModel, "target_status", spec.target)
	}
	slog.Info("done", "count", len(specs))
}

func must(err error) {
	if err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

// --- signing key helper: generates + registers a real signing key for an
// existing user, exactly like a device would, but signed with a key this
// script holds directly. ---

type seedSigner struct {
	priv    *ecdsa.PrivateKey
	address string
}

func newSeedSigner(ctx context.Context, repo *identity.Repo, userID uuid.UUID, label string) *seedSigner {
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	must(err)
	pub := priv.PublicKey
	jwk, _ := json.Marshal(map[string]string{
		"kty": "EC",
		"crv": "P-256",
		"x":   base64.RawURLEncoding.EncodeToString(pub.X.FillBytes(make([]byte, 32))),
		"y":   base64.RawURLEncoding.EncodeToString(pub.Y.FillBytes(make([]byte, 32))),
	})
	canonical, err := cryptoutil.CanonicalJSON(jwk)
	must(err)
	address := cryptoutil.DeriveAddress(canonical)

	_, err = repo.CreateSigningKey(ctx, userID, label, canonical, address)
	must(err)
	return &seedSigner{priv: priv, address: address}
}

// sign matches cryptoutil.VerifyWebCryptoECDSA's expectation: the signature
// covers SHA-256(recordHashToSign), packed as raw 32-byte r || 32-byte s.
func (s *seedSigner) sign(recordHashToSign []byte) []byte {
	digest := sha256.Sum256(recordHashToSign)
	r, sVal, err := ecdsa.Sign(rand.Reader, s.priv, digest[:])
	must(err)
	out := make([]byte, 64)
	r.FillBytes(out[:32])
	sVal.FillBytes(out[32:])
	return out
}

// --- transition helpers wrapping prepare -> sign -> commit ---

func submitPassport(ctx context.Context, svc *passport.Service, user *identity.User, signer *seedSigner, id uuid.UUID, data json.RawMessage) error {
	pending, err := svc.PrepareTransition(ctx, user, id, passport.EventSubmit, data)
	if err != nil {
		return fmt.Errorf("prepare submit: %w", err)
	}
	sig := signer.sign(pending.RecordHashToSign)
	if _, _, err := svc.CommitTransition(ctx, user, pending.ID, signer.address, sig); err != nil {
		return fmt.Errorf("commit submit: %w", err)
	}
	return nil
}

func decidePassport(ctx context.Context, svc *certification.Service, user *identity.User, signer *seedSigner, id uuid.UUID, approve bool, notes string) error {
	pending, err := svc.PrepareDecision(ctx, user, id, approve, notes)
	if err != nil {
		return fmt.Errorf("prepare decision: %w", err)
	}
	sig := signer.sign(pending.RecordHashToSign)
	if _, _, err := svc.CommitDecision(ctx, user, pending.ID, signer.address, sig); err != nil {
		return fmt.Errorf("commit decision: %w", err)
	}
	return nil
}

func publishPassport(ctx context.Context, svc *passport.Service, user *identity.User, signer *seedSigner, id uuid.UUID, data json.RawMessage) error {
	pending, err := svc.PrepareTransition(ctx, user, id, passport.EventPublish, data)
	if err != nil {
		return fmt.Errorf("prepare publish: %w", err)
	}
	sig := signer.sign(pending.RecordHashToSign)
	if _, _, err := svc.CommitTransition(ctx, user, pending.ID, signer.address, sig); err != nil {
		return fmt.Errorf("commit publish: %w", err)
	}
	return nil
}

func amendPassport(ctx context.Context, svc *passport.Service, user *identity.User, signer *seedSigner, id uuid.UUID, data json.RawMessage) error {
	pending, err := svc.PrepareTransition(ctx, user, id, passport.EventAmend, data)
	if err != nil {
		return fmt.Errorf("prepare amend: %w", err)
	}
	sig := signer.sign(pending.RecordHashToSign)
	if _, _, err := svc.CommitTransition(ctx, user, pending.ID, signer.address, sig); err != nil {
		return fmt.Errorf("commit amend: %w", err)
	}
	return nil
}

func endOfLifePassport(ctx context.Context, svc *passport.Service, user *identity.User, signer *seedSigner, id uuid.UUID, data json.RawMessage) error {
	pending, err := svc.PrepareTransition(ctx, user, id, passport.EventEndOfLife, data)
	if err != nil {
		return fmt.Errorf("prepare end_of_life: %w", err)
	}
	sig := signer.sign(pending.RecordHashToSign)
	if _, _, err := svc.CommitTransition(ctx, user, pending.ID, signer.address, sig); err != nil {
		return fmt.Errorf("commit end_of_life: %w", err)
	}
	return nil
}
