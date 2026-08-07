import { signHash } from "@/lib/crypto/signing";
import type { PendingRecord } from "./types";

/**
 * Same prepare -> sign locally -> commit flow as the web app: `prepare` asks
 * the backend for a hash to sign, this device signs it without the private
 * key ever leaving SecureStore, and `commit` sends the signature back.
 */
export async function signAndCommit<TResult>(
  prepare: () => Promise<PendingRecord>,
  commit: (body: { pendingId: string; signerAddress: string; signature: string }) => Promise<TResult>,
): Promise<TResult> {
  const pending = await prepare();
  const { signature, address } = await signHash(pending.recordHashToSign);
  return commit({ pendingId: pending.id, signerAddress: address, signature });
}
