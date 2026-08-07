import { getPrimarySigningAddress, signHashForAddress } from "@/lib/crypto/signing";
import type { PendingRecord } from "./types";

export class NoSigningKeyError extends Error {
  constructor() {
    super("This device has no signing key yet. Finish device setup first.");
  }
}

/**
 * Runs the prepare -> sign locally -> commit flow shared by every ledger
 * mutation (passport transitions, certification decisions). `prepare` asks
 * the backend for a hash to sign; this device signs it without ever sending
 * the private key anywhere; `commit` sends the signature back.
 */
export async function signAndCommit<TResult>(
  prepare: () => Promise<PendingRecord>,
  commit: (body: { pendingId: string; signerAddress: string; signature: string }) => Promise<TResult>,
): Promise<TResult> {
  const address = await getPrimarySigningAddress();
  if (!address) throw new NoSigningKeyError();

  const pending = await prepare();
  const signature = await signHashForAddress(address, pending.recordHashToSign);
  return commit({ pendingId: pending.id, signerAddress: address, signature });
}
