package passport

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusDraft     Status = "draft"
	StatusSubmitted Status = "submitted"
	StatusCertified Status = "certified"
	StatusPublished Status = "published"
	StatusAmended   Status = "amended"
	StatusEndOfLife Status = "end_of_life"
)

// Ledger event types recognized by Service.applyTransition.
const (
	EventSubmit    = "submit"
	EventPublish   = "publish"
	EventAmend     = "amend"
	EventEndOfLife = "end_of_life"
	// Certification events are appended by the certification package but land
	// in the same per-passport chain, keyed off these event type strings.
	EventCertifyApprove = "certify_approve"
	EventCertifyReject  = "certify_reject"
)

type Passport struct {
	ID               uuid.UUID  `json:"id"`
	PublicCode       string     `json:"publicCode"`
	Category         string     `json:"category"`
	Status           Status     `json:"status"`
	OrganizationID   uuid.UUID  `json:"organizationId"`
	CurrentVersionID *uuid.UUID `json:"currentVersionId,omitempty"`
	CreatedBy        uuid.UUID  `json:"createdBy"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type Version struct {
	ID              uuid.UUID       `json:"id"`
	PassportID      uuid.UUID       `json:"passportId"`
	VersionNumber   int             `json:"versionNumber"`
	StatusAtVersion Status          `json:"statusAtVersion"`
	Data            json.RawMessage `json:"data"`
	CreatedBy       uuid.UUID       `json:"createdBy"`
	LedgerRecordID  *uuid.UUID      `json:"ledgerRecordId,omitempty"`
	CreatedAt       time.Time       `json:"createdAt"`
}

// BatteryData documents the representative EU Battery Regulation (EU 2023/1542)
// categories the issuance wizard collects. It is stored as the version's jsonb
// payload; Service.validateBatterySections only checks that each top-level
// section is present (not an exhaustive field-level schema), keeping the
// category-specific shape flexible for future product categories.
type BatteryData struct {
	ProductIdentifier     ProductIdentifier     `json:"productIdentifier"`
	ManufacturerInfo      ManufacturerInfo      `json:"manufacturerInfo"`
	MaterialsComposition  MaterialsComposition  `json:"materialsComposition"`
	CarbonFootprint       CarbonFootprint       `json:"carbonFootprint"`
	RecycledContent       RecycledContent       `json:"recycledContent"`
	PerformanceDurability PerformanceDurability `json:"performanceDurability"`
	CollectionTakeback    CollectionTakeback    `json:"collectionTakeback"`
	DueDiligence          DueDiligence          `json:"dueDiligence"`
	DismantlingSecondLife DismantlingSecondLife `json:"dismantlingSecondLife"`
}

type ProductIdentifier struct {
	BatteryModel    string `json:"batteryModel"`
	SerialOrBatch   string `json:"serialOrBatch"`
	BatteryCategory string `json:"batteryCategory"` // e.g. "EV", "LMT", "industrial", "portable"
}

type ManufacturerInfo struct {
	Name              string `json:"name"`
	EURegistrationID  string `json:"euRegistrationId"`
	ManufacturingSite string `json:"manufacturingSite"`
}

type MaterialsComposition struct {
	Chemistry            string   `json:"chemistry"` // e.g. "NMC", "LFP", "NiMH"
	CriticalRawMaterials []string `json:"criticalRawMaterials"`
	HazardousSubstances  []string `json:"hazardousSubstances"`
}

type CarbonFootprint struct {
	TotalKgCO2Equivalent float64 `json:"totalKgCo2Equivalent"`
	MethodologyReference string  `json:"methodologyReference"`
}

type RecycledContent struct {
	CobaltPercent  float64 `json:"cobaltPercent"`
	LithiumPercent float64 `json:"lithiumPercent"`
	NickelPercent  float64 `json:"nickelPercent"`
	LeadPercent    float64 `json:"leadPercent"`
}

type PerformanceDurability struct {
	RatedCapacityAh   float64 `json:"ratedCapacityAh"`
	ExpectedCycleLife int     `json:"expectedCycleLife"`
	WarrantyYears     float64 `json:"warrantyYears"`
}

type CollectionTakeback struct {
	TakebackSchemeName string `json:"takebackSchemeName"`
	Instructions       string `json:"instructions"`
}

type DueDiligence struct {
	PolicyReference string `json:"policyReference"`
	LastAuditDate   string `json:"lastAuditDate"`
}

type DismantlingSecondLife struct {
	DismantlingInstructions string `json:"dismantlingInstructions"`
	SecondLifeSuitability   string `json:"secondLifeSuitability"`
}
