package auth

import (
	"blockchain-passport/api/internal/identity"

	"github.com/go-webauthn/webauthn/webauthn"
)

// webauthnUser adapts our identity.User + stored credentials to the go-webauthn User interface.
type webauthnUser struct {
	user        *identity.User
	credentials []webauthn.Credential
}

func (u *webauthnUser) WebAuthnID() []byte                         { return u.user.WebAuthnUserHandle }
func (u *webauthnUser) WebAuthnName() string                       { return u.user.Email }
func (u *webauthnUser) WebAuthnDisplayName() string                { return u.user.DisplayName }
func (u *webauthnUser) WebAuthnCredentials() []webauthn.Credential { return u.credentials }
