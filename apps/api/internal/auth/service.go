package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"time"

	"blockchain-passport/api/internal/identity"

	"github.com/go-webauthn/webauthn/protocol"
	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/google/uuid"
)

const (
	ceremonyTTL       = 5 * time.Minute
	sessionTTL        = 30 * 24 * time.Hour
	SessionCookieName = "passport_session"
)

var ErrRegistrationExists = errors.New("email already registered")

type Service struct {
	wa       *webauthn.WebAuthn
	authRepo *Repo
	users    *identity.Repo
}

func NewService(cfg *webauthn.Config, authRepo *Repo, users *identity.Repo) (*Service, error) {
	wa, err := webauthn.New(cfg)
	if err != nil {
		return nil, err
	}
	return &Service{wa: wa, authRepo: authRepo, users: users}, nil
}

// --- Registration ---

func (s *Service) BeginRegistration(ctx context.Context, email, displayName string, role identity.Role, organizationName string) (*protocol.CredentialCreation, uuid.UUID, uuid.UUID, error) {
	if _, err := s.users.GetUserByEmail(ctx, email); err == nil {
		return nil, uuid.Nil, uuid.Nil, ErrRegistrationExists
	}

	handle := make([]byte, 64)
	if _, err := rand.Read(handle); err != nil {
		return nil, uuid.Nil, uuid.Nil, err
	}

	var orgID *uuid.UUID
	if role == identity.RoleManufacturer && organizationName != "" {
		org, err := s.users.CreateOrganization(ctx, organizationName, "", "")
		if err != nil {
			return nil, uuid.Nil, uuid.Nil, err
		}
		orgID = &org.ID
	}

	user, err := s.users.CreateUser(ctx, email, displayName, role, orgID, handle)
	if err != nil {
		return nil, uuid.Nil, uuid.Nil, err
	}

	wu := &webauthnUser{user: user}
	creation, session, err := s.wa.BeginRegistration(wu)
	if err != nil {
		return nil, uuid.Nil, uuid.Nil, err
	}

	ceremonyID, err := s.authRepo.SaveCeremonySession(ctx, "register", &user.ID, session, ceremonyTTL)
	if err != nil {
		return nil, uuid.Nil, uuid.Nil, err
	}
	return creation, ceremonyID, user.ID, nil
}

func (s *Service) FinishRegistration(ctx context.Context, ceremonyID, userID uuid.UUID, deviceLabel string, r *http.Request) (*identity.User, error) {
	session, err := s.authRepo.LoadCeremonySession(ctx, ceremonyID)
	if err != nil {
		return nil, err
	}
	user, err := s.users.GetUserByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	wu := &webauthnUser{user: user}

	cred, err := s.wa.FinishRegistration(wu, *session, r)
	if err != nil {
		return nil, err
	}
	if deviceLabel == "" {
		deviceLabel = "This device"
	}
	if err := s.authRepo.SaveCredential(ctx, user.ID, cred, deviceLabel); err != nil {
		return nil, err
	}
	_ = s.authRepo.DeleteCeremonySession(ctx, ceremonyID)
	return user, nil
}

// --- Login (discoverable / passkey, no email required) ---

func (s *Service) BeginLogin(ctx context.Context) (*protocol.CredentialAssertion, uuid.UUID, error) {
	assertion, session, err := s.wa.BeginDiscoverableLogin()
	if err != nil {
		return nil, uuid.Nil, err
	}
	ceremonyID, err := s.authRepo.SaveCeremonySession(ctx, "login", nil, session, ceremonyTTL)
	if err != nil {
		return nil, uuid.Nil, err
	}
	return assertion, ceremonyID, nil
}

func (s *Service) FinishLogin(ctx context.Context, ceremonyID uuid.UUID, r *http.Request) (*identity.User, error) {
	session, err := s.authRepo.LoadCeremonySession(ctx, ceremonyID)
	if err != nil {
		return nil, err
	}

	handler := func(rawID, userHandle []byte) (webauthn.User, error) {
		user, err := s.users.GetUserByWebAuthnHandle(ctx, userHandle)
		if err != nil {
			return nil, err
		}
		creds, err := s.authRepo.ListCredentialsForUser(ctx, user.ID)
		if err != nil {
			return nil, err
		}
		return &webauthnUser{user: user, credentials: creds}, nil
	}

	waUser, cred, err := s.wa.FinishPasskeyLogin(handler, *session, r)
	if err != nil {
		return nil, err
	}
	if err := s.authRepo.UpdateCredential(ctx, cred); err != nil {
		return nil, err
	}
	_ = s.authRepo.DeleteCeremonySession(ctx, ceremonyID)

	wu := waUser.(*webauthnUser)
	return wu.user, nil
}

// --- App session cookie ---

func (s *Service) CreateSession(ctx context.Context, userID uuid.UUID, userAgent, ip string) (string, time.Time, error) {
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return "", time.Time{}, err
	}
	token := hex.EncodeToString(tokenBytes)
	expires := time.Now().Add(sessionTTL)
	if err := s.authRepo.CreateSession(ctx, token, userID, sessionTTL, userAgent, ip); err != nil {
		return "", time.Time{}, err
	}
	return token, expires, nil
}

func (s *Service) UserFromSessionToken(ctx context.Context, token string) (*identity.User, error) {
	userID, err := s.authRepo.GetSessionUserID(ctx, token)
	if err != nil {
		return nil, err
	}
	return s.users.GetUserByID(ctx, userID)
}

func (s *Service) Logout(ctx context.Context, token string) error {
	return s.authRepo.DeleteSession(ctx, token)
}

// --- Device pairing (secondary-device sign-in by code) ---

const (
	pairingCodeTTL      = 5 * time.Minute
	pairingCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I ambiguity
	pairingCodeLength   = 6
)

func generatePairingCode() (string, error) {
	buf := make([]byte, pairingCodeLength)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	out := make([]byte, pairingCodeLength)
	for i, b := range buf {
		out[i] = pairingCodeAlphabet[int(b)%len(pairingCodeAlphabet)]
	}
	return string(out), nil
}

// BeginDevicePairing is called from an already-authenticated session (the web
// app) to mint a short-lived code a native client can redeem for a session of
// its own — see RedeemDevicePairing.
func (s *Service) BeginDevicePairing(ctx context.Context, userID uuid.UUID) (string, time.Time, error) {
	for attempt := 0; attempt < 5; attempt++ {
		code, err := generatePairingCode()
		if err != nil {
			return "", time.Time{}, err
		}
		expiresAt, err := s.authRepo.CreatePairingCode(ctx, code, userID, pairingCodeTTL)
		if err == nil {
			return code, expiresAt, nil
		}
	}
	return "", time.Time{}, errors.New("auth: failed to allocate a pairing code")
}

// RedeemDevicePairing exchanges a pairing code for a new session, both as a
// cookie (unused by native clients) and as a raw token in the response body
// (what the native client actually stores, since RN's cookie handling is
// unreliable across platforms — see auth.Middleware's Bearer fallback).
func (s *Service) RedeemDevicePairing(ctx context.Context, code string) (*identity.User, error) {
	userID, err := s.authRepo.RedeemPairingCode(ctx, code)
	if err != nil {
		return nil, err
	}
	return s.users.GetUserByID(ctx, userID)
}
