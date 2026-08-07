import { api } from "./client";
import type {
  Certification,
  LedgerRecord,
  Passport,
  PassportVersion,
  PendingRecord,
  QueueItem,
  SigningKey,
  User,
  VerifyResult,
} from "./types";

// --- auth ---

export const authApi = {
  session: () => api.get<User>("/auth/session"),
  logout: () => api.post<{ ok: boolean }>("/auth/logout"),
  beginRegistration: (body: {
    email: string;
    displayName: string;
    role: string;
    organizationName?: string;
  }) =>
    api.post<{
      ceremonyId: string;
      userId: string;
      options: { publicKey: PublicKeyCredentialCreationOptionsJSON };
    }>("/auth/webauthn/register/begin", body),
  finishRegistration: (
    ceremonyId: string,
    userId: string,
    deviceLabel: string,
    credential: unknown,
  ) =>
    api.post<User>(
      `/auth/webauthn/register/finish?ceremonyId=${ceremonyId}&userId=${userId}&deviceLabel=${encodeURIComponent(deviceLabel)}`,
      credential,
    ),
  beginLogin: () =>
    api.post<{ ceremonyId: string; options: { publicKey: PublicKeyCredentialRequestOptionsJSON } }>(
      "/auth/webauthn/login/begin",
    ),
  finishLogin: (ceremonyId: string, credential: unknown) =>
    api.post<User>(`/auth/webauthn/login/finish?ceremonyId=${ceremonyId}`, credential),
  beginDevicePairing: () => api.post<{ code: string; expiresAt: string }>("/auth/device/pair/begin"),
};

// Minimal shape of the WebAuthn spec's JSON dictionaries — just enough to pass
// through to PublicKeyCredential.parseCreationOptionsFromJSON /
// parseRequestOptionsFromJSON without re-typing the entire spec.
export type PublicKeyCredentialCreationOptionsJSON = Record<string, unknown>;
export type PublicKeyCredentialRequestOptionsJSON = Record<string, unknown>;

// --- identity / signing keys ---

export const identityApi = {
  listSigningKeys: () => api.get<SigningKey[]>("/identity/signing-keys"),
  createSigningKey: (body: { deviceLabel: string; publicKeyJwk: JsonWebKey }) =>
    api.post<SigningKey>("/identity/signing-keys", body),
  revokeSigningKey: (id: string) => api.del<{ ok: boolean }>(`/identity/signing-keys/${id}`),
};

// --- passports ---

export const passportApi = {
  create: (body: { category: string; data: unknown }) =>
    api.post<{ passport: Passport; version: PassportVersion }>("/passports", body),
  list: () => api.get<Passport[]>("/passports"),
  get: (id: string) => api.get<{ passport: Passport; versions: PassportVersion[] }>(`/passports/${id}`),
  updateDraft: (id: string, data: unknown) =>
    api.patch<PassportVersion>(`/passports/${id}`, { data }),
  ledger: (id: string) => api.get<LedgerRecord[]>(`/passports/${id}/ledger`),
  verifyLedger: (id: string) => api.get<VerifyResult>(`/passports/${id}/ledger/verify`),
  prepareTransition: (id: string, eventType: string, data: unknown) =>
    api.post<PendingRecord>(`/passports/${id}/transitions/prepare`, { eventType, data }),
  commitTransition: (body: { pendingId: string; signerAddress: string; signature: string }) =>
    api.post<{ record: LedgerRecord; passport: Passport }>("/passports/transitions/commit", body),
};

// --- certification ---

export const certificationApi = {
  queue: () => api.get<QueueItem[]>("/certifications/queue"),
  listForPassport: (passportId: string) =>
    api.get<Certification[]>(`/passports/${passportId}/certifications`),
  prepareDecision: (passportId: string, approve: boolean, notes: string) =>
    api.post<PendingRecord>(`/passports/${passportId}/certifications/prepare`, { approve, notes }),
  commitDecision: (body: { pendingId: string; signerAddress: string; signature: string }) =>
    api.post<{ record: LedgerRecord; passport: Passport }>("/certifications/commit", body),
};

// --- public verification ---

export const verificationApi = {
  getByCode: (code: string) =>
    api.get<{ passport: Passport; versions: PassportVersion[]; chainVerify: VerifyResult }>(
      `/public/passports/${code}`,
    ),
  ledger: (code: string) => api.get<LedgerRecord[]>(`/public/passports/${code}/ledger`),
};
