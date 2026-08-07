package identity

import (
	"encoding/json"
	"net/http"

	"blockchain-passport/api/internal/cryptoutil"
	"blockchain-passport/api/internal/platform"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type Handlers struct {
	repo *Repo
}

func NewHandlers(repo *Repo) *Handlers {
	return &Handlers{repo: repo}
}

type createSigningKeyRequest struct {
	DeviceLabel  string          `json:"deviceLabel"`
	PublicKeyJWK json.RawMessage `json:"publicKeyJwk"`
}

func (h *Handlers) CreateSigningKey(w http.ResponseWriter, r *http.Request) {
	user, _ := ContextUser(r.Context())

	var req createSigningKeyRequest
	if err := platform.DecodeJSON(r, &req); err != nil || len(req.PublicKeyJWK) == 0 {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "publicKeyJwk is required")
		return
	}

	canonical, err := cryptoutil.CanonicalJSON(req.PublicKeyJWK)
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "publicKeyJwk is not valid JSON")
		return
	}
	if _, err := cryptoutil.PublicKeyFromJWK(canonical); err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "publicKeyJwk must be an EC P-256 public key")
		return
	}

	address := cryptoutil.DeriveAddress(canonical)
	deviceLabel := req.DeviceLabel
	if deviceLabel == "" {
		deviceLabel = "This device"
	}

	key, err := h.repo.CreateSigningKey(r.Context(), user.ID, deviceLabel, canonical, address)
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	platform.WriteJSON(w, http.StatusCreated, key)
}

func (h *Handlers) ListSigningKeys(w http.ResponseWriter, r *http.Request) {
	user, _ := ContextUser(r.Context())
	keys, err := h.repo.ListSigningKeys(r.Context(), user.ID)
	if err != nil {
		platform.WriteError(w, http.StatusInternalServerError, "internal_error", err.Error())
		return
	}
	platform.WriteJSON(w, http.StatusOK, keys)
}

func (h *Handlers) RevokeSigningKey(w http.ResponseWriter, r *http.Request) {
	user, _ := ContextUser(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		platform.WriteError(w, http.StatusBadRequest, "bad_request", "invalid id")
		return
	}
	if err := h.repo.RevokeSigningKey(r.Context(), id, user.ID); err != nil {
		platform.WriteError(w, http.StatusNotFound, "not_found", "signing key not found")
		return
	}
	platform.WriteJSON(w, http.StatusOK, map[string]bool{"ok": true})
}
