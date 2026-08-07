// Package verification exposes the no-authentication endpoints a consumer
// hits after scanning a passport's QR code: the compliance data and its
// chain-of-custody / ledger integrity check.
package verification

import (
	"errors"
	"net/http"

	"blockchain-passport/api/internal/passport"
	"blockchain-passport/api/internal/platform"

	"github.com/go-chi/chi/v5"
)

type Handlers struct {
	passports *passport.Service
}

func NewHandlers(passports *passport.Service) *Handlers {
	return &Handlers{passports: passports}
}

func (h *Handlers) GetByCode(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	p, versions, err := h.passports.GetPublic(r.Context(), code)
	if errors.Is(err, passport.ErrNotFound) {
		platform.WriteError(w, http.StatusNotFound, "not_found", "no passport found for this code")
		return
	}
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}

	verify, err := h.passports.VerifyChain(r.Context(), p.ID)
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}

	platform.WriteJSON(w, http.StatusOK, map[string]any{
		"passport":    p,
		"versions":    versions,
		"chainVerify": verify,
	})
}

func (h *Handlers) GetLedger(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	chain, err := h.passports.GetChainPublic(r.Context(), code)
	if errors.Is(err, passport.ErrNotFound) {
		platform.WriteError(w, http.StatusNotFound, "not_found", "no passport found for this code")
		return
	}
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	platform.WriteJSON(w, http.StatusOK, chain)
}
