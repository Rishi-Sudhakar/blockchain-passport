package passport

import (
	"encoding/json"
	"errors"
	"net/http"

	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/ledger"
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
	case errors.Is(err, ErrNotFound):
		platform.WriteError(w, http.StatusNotFound, "not_found", "passport not found")
	case errors.Is(err, ErrForbidden):
		platform.WriteError(w, http.StatusForbidden, "forbidden", "not permitted for this passport")
	case errors.Is(err, ErrInvalidTransition):
		platform.WriteError(w, http.StatusConflict, "invalid_transition", "this action is not valid for the passport's current status")
	case errors.Is(err, ErrUnsupportedEvent):
		platform.WriteError(w, http.StatusBadRequest, "unsupported_event", "unsupported event type")
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

type createPassportRequest struct {
	Category string          `json:"category"`
	Data     json.RawMessage `json:"data"`
}

func (h *Handlers) Create(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	var req createPassportRequest
	if err := platform.DecodeJSON(r, &req); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	if req.Category == "" {
		req.Category = "battery"
	}
	p, v, err := h.svc.CreateDraft(r.Context(), user, req.Category, req.Data)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusCreated, map[string]any{"passport": p, "version": v})
}

func (h *Handlers) List(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	list, err := h.svc.ListMine(r.Context(), user)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, list)
}

func (h *Handlers) Get(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	p, err := h.svc.Get(r.Context(), user, id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	versions, err := h.svc.ListVersions(r.Context(), user, id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, map[string]any{"passport": p, "versions": versions})
}

type updateDraftRequest struct {
	Data json.RawMessage `json:"data"`
}

func (h *Handlers) UpdateDraft(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	var req updateDraftRequest
	if err := platform.DecodeJSON(r, &req); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	v, err := h.svc.UpdateDraft(r.Context(), user, id, req.Data)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, v)
}

func (h *Handlers) Ledger(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	chain, err := h.svc.GetChain(r.Context(), user, id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, chain)
}

func (h *Handlers) VerifyLedger(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	result, err := h.svc.VerifyChain(r.Context(), id)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, result)
}

type prepareTransitionRequest struct {
	EventType string          `json:"eventType"`
	Data      json.RawMessage `json:"data"`
}

func (h *Handlers) PrepareTransition(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	var req prepareTransitionRequest
	if err := platform.DecodeJSON(r, &req); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	pending, err := h.svc.PrepareTransition(r.Context(), user, id, req.EventType, req.Data)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, pending)
}

type commitTransitionRequest struct {
	PendingID     uuid.UUID `json:"pendingId"`
	SignerAddress string    `json:"signerAddress"`
	Signature     []byte    `json:"signature"`
}

func (h *Handlers) CommitTransition(w http.ResponseWriter, r *http.Request) {
	user, _ := identity.ContextUser(r.Context())
	var req commitTransitionRequest
	if err := platform.DecodeJSON(r, &req); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid body")
		return
	}
	record, p, err := h.svc.CommitTransition(r.Context(), user, req.PendingID, req.SignerAddress, req.Signature)
	if err != nil {
		writeServiceError(w, err)
		return
	}
	platform.WriteJSON(w, http.StatusOK, map[string]any{"record": record, "passport": p})
}
