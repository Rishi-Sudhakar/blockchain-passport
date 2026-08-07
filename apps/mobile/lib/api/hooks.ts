import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificationApi, identityApi, passportApi, verificationApi } from "./resources";
import { signAndCommit } from "./sign-and-commit";

export function usePassports() {
  return useQuery({ queryKey: ["passports"], queryFn: passportApi.list });
}

export function usePassport(id: string) {
  return useQuery({ queryKey: ["passports", id], queryFn: () => passportApi.get(id), enabled: !!id });
}

export function usePassportLedger(id: string) {
  return useQuery({ queryKey: ["passports", id, "ledger"], queryFn: () => passportApi.ledger(id), enabled: !!id });
}

export function usePassportLedgerVerify(id: string) {
  return useQuery({
    queryKey: ["passports", id, "ledger", "verify"],
    queryFn: () => passportApi.verifyLedger(id),
    enabled: !!id,
  });
}

export function useCertificationQueue() {
  return useQuery({ queryKey: ["certification-queue"], queryFn: certificationApi.queue });
}

export function useSigningKeys() {
  return useQuery({ queryKey: ["signing-keys"], queryFn: identityApi.listSigningKeys });
}

export function usePassportTransition(passportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { eventType: string; data: unknown }) =>
      signAndCommit(
        () => passportApi.prepareTransition(passportId, vars.eventType, vars.data),
        passportApi.commitTransition,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["passports"] });
      qc.invalidateQueries({ queryKey: ["passports", passportId] });
      qc.invalidateQueries({ queryKey: ["passports", passportId, "ledger"] });
      qc.invalidateQueries({ queryKey: ["certification-queue"] });
    },
  });
}

export function useCertificationDecision(passportId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { approve: boolean; notes: string }) =>
      signAndCommit(
        () => certificationApi.prepareDecision(passportId, vars.approve, vars.notes),
        certificationApi.commitDecision,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["passports"] });
      qc.invalidateQueries({ queryKey: ["passports", passportId] });
      qc.invalidateQueries({ queryKey: ["passports", passportId, "ledger"] });
      qc.invalidateQueries({ queryKey: ["certification-queue"] });
    },
  });
}

export function usePublicPassport(code: string) {
  return useQuery({
    queryKey: ["public-passport", code],
    queryFn: () => verificationApi.getByCode(code),
    enabled: !!code,
    retry: false,
  });
}
