package certification

import (
	"errors"
	"net/http"

	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/ledger"
	"blockchain-passport/api/internal/passport"
	"blockchain-passport/api/internal/platform"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handlers struct {
	svc *Service
}

func NewHandlers(svc *Service) *Handlers {
	return &Handlers{svc: svc}
}

func writeServiceError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, passport.ErrNotFound):
		platform.WriteError(w, http.StatusNotFound, "not_found", "passport not found")
	case errors.Is(err, ErrForbidden):
		platform.WriteError(w, http.StatusForbidden, "forbidden", "certifier or admin role required")
	case errors.Is(err, ErrInvalidTransition):
		platform.WriteError(w, http.StatusConflict, "invalid_transition", "passport is not awaiting certification")
	case errors.Is(err, ErrNoPendingRequest):
		platform.WriteError(w, http.StatusConflict, "no_pending_request", "no pending certification request for this passport")
	case errors.Is(err, ledger.ErrHeadMoved):
		platform.WriteError(w, http.StatusConflict, "chain_head_moved", "the ledger advanced since prepare; re-prepare and retry")
	case errors.Is(err, ledger.ErrPendingExpired):
		platform.WriteError(w, http.StatusConflict, "pending_expired", "the prepared record expired; re-prepare and retry")
	case errors.Is(err, ledger.ErrInvalidSignature):
		platform.WriteError(w, http.StatusBadRequest, "invalid_signature", "signature verification failed")
	default:
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
	}
}

func (h *Handlers) ListForPassport(w http.ResponseWriter, r *http.Request) {
	passportID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	list, err := h.svc.ListForPassport(r.Context(), passportID)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, list)
}

func (h *Handlers) Queue(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	items, err := h.svc.Queue(r.Context(), user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, items)
}

type prepareDecisionRequest struct {
	Approve bool   `json:"approve"`
	Notes   string `json:"notes"`
}

func (h *Handlers) PrepareDecision(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	passportID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	var req prepareDecisionRequest
	if err := platform.DecodeJSON(r, &req); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	pending, err := h.svc.PrepareDecision(r.Context(), user, passportID, req.Approve, req.Notes)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, pending)
}

type commitDecisionRequest struct {
	PendingID     uuid.UUID `json:"pendingId"`
	SignerAddress string    `json:"signerAddress"`
	Signature     []byte    `json:"signature"`
}

func (h *Handlers) CommitDecision(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	var req commitDecisionRequest
	if err := platform.DecodeJSON(r, &req); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	record, p, err := h.svc.CommitDecision(r.Context(), user, req.PendingID, req.SignerAddress, req.Signature)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, map[string]any{"record": record, "passport": p})
}
