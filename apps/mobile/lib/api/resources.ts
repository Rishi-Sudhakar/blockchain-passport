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

export const authApi = {
  session: () => api.get<User>("/auth/session"),
  logout: () => api.post<{ ok: boolean }>("/auth/logout"),
  redeemDevicePairing: (code: string) =>
    api.post<{ user: User; token: string; expiresAt: string }>("/auth/device/pair/redeem", { code }),
};

export const identityApi = {
  listSigningKeys: () => api.get<SigningKey[]>("/identity/signing-keys"),
  createSigningKey: (body: { deviceLabel: string; publicKeyJwk: Record<string, string> }) =>
    api.post<SigningKey>("/identity/signing-keys", body),
  revokeSigningKey: (id: string) => api.del<{ ok: boolean }>(`/identity/signing-keys/${id}`),
};

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

export const certificationApi = {
  queue: () => api.get<QueueItem[]>("/certifications/queue"),
  listForPassport: (passportId: string) =>
    api.get<Certification[]>(`/passports/${passportId}/certifications`),
  prepareDecision: (passportId: string, approve: boolean, notes: string) =>
    api.post<PendingRecord>(`/passports/${passportId}/certifications/prepare`, { approve, notes }),
  commitDecision: (body: { pendingId: string; signerAddress: string; signature: string }) =>
    api.post<{ record: LedgerRecord; passport: Passport }>("/certifications/commit", body),
};

export const verificationApi = {
  getByCode: (code: string) =>
    api.get<{ passport: Passport; versions: PassportVersion[]; chainVerify: VerifyResult }>(
      `/public/passports/${code}`,
    ),
  ledger: (code: string) => api.get<LedgerRecord[]>(`/public/passports/${code}/ledger`),
};
