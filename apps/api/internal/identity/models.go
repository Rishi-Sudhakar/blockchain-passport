package identity

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleManufacturer Role = "manufacturer"
	RoleCertifier    Role = "certifier"
	RoleAdmin        Role = "admin"
	RoleConsumer     Role = "consumer"
)

type User struct {
	ID                 uuid.UUID  `json:"id"`
	Email              string     `json:"email"`
	DisplayName        string     `json:"displayName"`
	Role               Role       `json:"role"`
	OrganizationID     *uuid.UUID `json:"organizationId,omitempty"`
	WebAuthnUserHandle []byte     `json:"-"`
	CreatedAt          time.Time  `json:"createdAt"`
}

type Organization struct {
	ID               uuid.UUID `json:"id"`
	Name             string    `json:"name"`
	EURegistrationID string    `json:"euRegistrationId"`
	Country          string    `json:"country"`
	CreatedAt        time.Time `json:"createdAt"`
}

type SigningKey struct {
	ID           uuid.UUID  `json:"id"`
	UserID       uuid.UUID  `json:"userId"`
	DeviceLabel  string     `json:"deviceLabel"`
	PublicKeyJWK []byte     `json:"publicKeyJwk"`
	Address      string     `json:"address"`
	CreatedAt    time.Time  `json:"createdAt"`
	RevokedAt    *time.Time `json:"revokedAt,omitempty"`
}
