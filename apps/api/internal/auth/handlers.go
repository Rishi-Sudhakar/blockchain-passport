package auth

import (
	"errors"
	"net/http"
	"time"

	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/platform"

	"github.com/google/uuid"
)

type Handlers struct {
	svc          *Service
	cookieSecure bool
}

func NewHandlers(svc *Service, cookieSecure bool) *Handlers {
	return &Handlers{svc: svc, cookieSecure: cookieSecure}
}

type beginRegistrationRequest struct {
	Email            string `json:"email"`
	DisplayName      string `json:"displayName"`
	Role             string `json:"role"`
	OrganizationName string `json:"organizationName"`
}

type beginRegistrationResponse struct {
	CeremonyID uuid.UUID   `json:"ceremonyId"`
	UserID     uuid.UUID   `json:"userId"`
	Options    interface{} `json:"options"`
}

func (h *Handlers) BeginRegistration(w http.ResponseWriter, r *http.Request) {
	var req beginRegistrationRequest
	if err := platform.DecodeJSON(r, &req); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	role := identity.RoleManufacturer
	if req.Role == string(identity.RoleCertifier) {
		role = identity.RoleCertifier
	}
	if req.Email == "" || req.DisplayName == "" {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "email and displayName are required")
		return
	}

	creation, ceremonyID, userID, err := h.svc.BeginRegistration(r.Context(), req.Email, req.DisplayName, role, req.OrganizationName)
	if errors.Is(err, ErrRegistrationExists) {
		platform.WriteError(w, http.StatusConflict, "email_taken", "an account with that email already exists")
		return
	}
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	platform.WriteJSON(w, http.StatusOK, beginRegistrationResponse{CeremonyID: ceremonyID, UserID: userID, Options: creation})
}

func (h *Handlers) FinishRegistration(w http.ResponseWriter, r *http.Request) {
	ceremonyID, err := uuid.Parse(r.URL.Query().Get("ceremonyId"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "missing or invalid ceremonyId")
		return
	}
	userID, err := uuid.Parse(r.URL.Query().Get("userId"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "missing or invalid userId")
		return
	}
	deviceLabel := r.URL.Query().Get("deviceLabel")

	user, err := h.svc.FinishRegistration(r.Context(), ceremonyID, userID, deviceLabel, r)
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "registration_failed", err.Error())
		return
	}

	token, expires, err := h.svc.CreateSession(r.Context(), user.ID, r.UserAgent(), r.RemoteAddr)
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	h.setSessionCookie(w, token, expires)
	platform.WriteJSON(w, http.StatusOK, user)
}

func (h *Handlers) BeginLogin(w http.ResponseWriter, r *http.Request) {
	assertion, ceremonyID, err := h.svc.BeginLogin(r.Context())
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	platform.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"ceremonyId": ceremonyID,
		"options":    assertion,
	})
}

func (h *Handlers) FinishLogin(w http.ResponseWriter, r *http.Request) {
	ceremonyID, err := uuid.Parse(r.URL.Query().Get("ceremonyId"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "missing or invalid ceremonyId")
		return
	}

	user, err := h.svc.FinishLogin(r.Context(), ceremonyID, r)
	if err != nil {
		platform.WriteError(w, http.StatusUnauthorized, "login_failed", err.Error())
		return
	}

	token, expires, err := h.svc.CreateSession(r.Context(), user.ID, r.UserAgent(), r.RemoteAddr)
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	h.setSessionCookie(w, token, expires)
	platform.WriteJSON(w, http.StatusOK, user)
}

func (h *Handlers) Logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(SessionCookieName); err == nil {
		_ = h.svc.Logout(r.Context(), cookie.Value)
	}
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
	platform.WriteJSON(w, http.StatusOK, map[string]bool{"ok": true})
}

func (h *Handlers) Session(w http.ResponseWriter, r *http.Request) {
	user, ok := ContextUser(r.Context())
	if !ok {
		platform.WriteError(w, http.StatusUnauthorized, "unauthenticated", "no session")
		return
	}
	platform.WriteJSON(w, http.StatusOK, user)
}

type beginPairingResponse struct {
	Code      string    `json:"code"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// BeginDevicePairing runs behind RequireAuth: an already-signed-in session
// (the web app) mints a short-lived code for a native client to redeem.
func (h *Handlers) BeginDevicePairing(w http.ResponseWriter, r *http.Request) {
	user, _ := ContextUser(r.Context())
	code, expiresAt, err := h.svc.BeginDevicePairing(r.Context(), user.ID)
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	platform.WriteJSON(w, http.StatusOK, beginPairingResponse{Code: code, ExpiresAt: expiresAt})
}

type redeemPairingRequest struct {
	Code string `json:"code"`
}

type redeemPairingResponse struct {
	User      *identity.User `json:"user"`
	Token     string         `json:"token"`
	ExpiresAt time.Time      `json:"expiresAt"`
}

// RedeemDevicePairing has no auth requirement — the code itself is the
// credential. It both sets a cookie (harmless if the caller ignores it) and
// returns the raw token, since native clients store it themselves and send
// it back as an Authorization: Bearer header (see Middleware.RequireAuth).
func (h *Handlers) RedeemDevicePairing(w http.ResponseWriter, r *http.Request) {
	var req redeemPairingRequest
	if err := platform.DecodeJSON(r, &req); err != nil || req.Code == "" {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "code is required")
		return
	}

	user, err := h.svc.RedeemDevicePairing(r.Context(), req.Code)
	if errors.Is(err, ErrNotFound) || errors.Is(err, ErrExpired) {
		platform.WriteError(w, http.StatusBadRequest, "invalid_code", "this code is invalid or has expired")
		return
	}
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}

	token, expires, err := h.svc.CreateSession(r.Context(), user.ID, r.UserAgent(), r.RemoteAddr)
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	h.setSessionCookie(w, token, expires)
	platform.WriteJSON(w, http.StatusOK, redeemPairingResponse{User: user, Token: token, ExpiresAt: expires})
}

func (h *Handlers) setSessionCookie(w http.ResponseWriter, token string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    token,
		Path:     "/",
		Expires:  expires,
		HttpOnly: true,
		Secure:   h.cookieSecure,
		SameSite: http.SameSiteLaxMode,
	})
}
