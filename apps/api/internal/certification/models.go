package certification

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusPending  Status = "pending"
	StatusApproved Status = "approved"
	StatusRejected Status = "rejected"
)

type Certification struct {
	ID                uuid.UUID  `json:"id"`
	PassportID        uuid.UUID  `json:"passportId"`
	PassportVersionID uuid.UUID  `json:"passportVersionId"`
	CertifierID       *uuid.UUID `json:"certifierId,omitempty"`
	Status            Status     `json:"status"`
	Notes             string     `json:"notes"`
	ReviewedAt        *time.Time `json:"reviewedAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
}
