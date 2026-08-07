// Hand-written TypeScript mirrors of the Go backend's JSON responses. A real
// production setup would generate these from docs/openapi.yaml (see the
// project plan); hand-writing them here keeps the build self-contained given
// the backend doesn't emit an OpenAPI spec yet — flagged as a follow-up.

export type Role = "manufacturer" | "certifier" | "admin" | "consumer";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  organizationId?: string;
  createdAt: string;
}

export interface SigningKey {
  id: string;
  userId: string;
  deviceLabel: string;
  publicKeyJwk: string; // base64-encoded JSON (Go []byte over the wire)
  address: string;
  createdAt: string;
  revokedAt?: string;
}

export type PassportStatus =
  | "draft"
  | "submitted"
  | "certified"
  | "published"
  | "amended"
  | "end_of_life";

export interface Passport {
  id: string;
  publicCode: string;
  category: string;
  status: PassportStatus;
  organizationId: string;
  currentVersionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PassportVersion {
  id: string;
  passportId: string;
  versionNumber: number;
  statusAtVersion: PassportStatus;
  data: BatteryData;
  createdBy: string;
  ledgerRecordId?: string;
  createdAt: string;
}

export interface LedgerRecord {
  id: string;
  passportId: string;
  sequenceNum: number;
  eventType: string;
  payload: unknown;
  payloadHash: string;
  prevHash: string;
  recordHash: string;
  signerUserId: string;
  signerAddress: string;
  signerPublicKeyJwk: unknown; // embedded JSON object (json.RawMessage on the wire)
  signature: string;
  signedAt: string;
  createdAt: string;
}

export interface PendingRecord {
  id: string;
  passportId: string;
  eventType: string;
  canonicalPayload: unknown;
  expectedPrevHash: string;
  expectedSequenceNum: number;
  recordHashToSign: string; // base64
  expiresAt: string;
}

export interface VerifyResult {
  valid: boolean;
  length: number;
  brokenAt?: number;
  reason?: string;
}

export type CertificationStatus = "pending" | "approved" | "rejected";

export interface Certification {
  id: string;
  passportId: string;
  passportVersionId: string;
  certifierId?: string;
  status: CertificationStatus;
  notes: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface QueueItem {
  certification: Certification;
  passport: Passport;
}

// --- EU Battery Regulation-inspired data shape ---

export interface BatteryData {
  productIdentifier: {
    batteryModel: string;
    serialOrBatch: string;
    batteryCategory: string;
  };
  manufacturerInfo: {
    name: string;
    euRegistrationId: string;
    manufacturingSite: string;
  };
  materialsComposition: {
    chemistry: string;
    criticalRawMaterials: string[];
    hazardousSubstances: string[];
  };
  carbonFootprint: {
    totalKgCo2Equivalent: number;
    methodologyReference: string;
  };
  recycledContent: {
    cobaltPercent: number;
    lithiumPercent: number;
    nickelPercent: number;
    leadPercent: number;
  };
  performanceDurability: {
    ratedCapacityAh: number;
    expectedCycleLife: number;
    warrantyYears: number;
  };
  collectionTakeback: {
    takebackSchemeName: string;
    instructions: string;
  };
  dueDiligence: {
    policyReference: string;
    lastAuditDate: string;
  };
  dismantlingSecondLife: {
    dismantlingInstructions: string;
    secondLifeSuitability: string;
  };
}

export const emptyBatteryData = (): BatteryData => ({
  productIdentifier: { batteryModel: "", serialOrBatch: "", batteryCategory: "EV" },
  manufacturerInfo: { name: "", euRegistrationId: "", manufacturingSite: "" },
  materialsComposition: { chemistry: "NMC", criticalRawMaterials: [], hazardousSubstances: [] },
  carbonFootprint: { totalKgCo2Equivalent: 0, methodologyReference: "" },
  recycledContent: { cobaltPercent: 0, lithiumPercent: 0, nickelPercent: 0, leadPercent: 0 },
  performanceDurability: { ratedCapacityAh: 0, expectedCycleLife: 0, warrantyYears: 0 },
  collectionTakeback: { takebackSchemeName: "", instructions: "" },
  dueDiligence: { policyReference: "", lastAuditDate: "" },
  dismantlingSecondLife: { dismantlingInstructions: "", secondLifeSuitability: "" },
});

export interface ApiErrorBody {
  error: { code: string; message: string };
}
