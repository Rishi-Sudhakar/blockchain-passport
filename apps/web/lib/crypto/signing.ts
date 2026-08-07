import { base64ToBytes, bytesToBase64 } from "./base64";
import { getSigningKey, listSigningKeys, putSigningKey } from "./idb";

const ALG: EcKeyGenParams = { name: "ECDSA", namedCurve: "P-256" };

/**
 * Generates a non-extractable ECDSA P-256 keypair, stores the private
 * CryptoKey in IndexedDB (never exposed as raw bytes, even to this code),
 * and returns the exported public JWK the backend derives an address from.
 */
export async function generateAndStoreSigningKey(
  deviceLabel: string,
): Promise<{ publicKeyJwk: JsonWebKey; tempAddress: string }> {
  const keyPair = await crypto.subtle.generateKey(ALG, false, ["sign"]);
  const publicKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);

  // The address isn't known yet — the backend derives it from the canonical
  // JWK and returns it — so we stage the key under a temp id and re-key it
  // once the server responds. See finalizeSigningKeyAddress.
  const tempAddress = `pending:${crypto.randomUUID()}`;
  await putSigningKey({
    address: tempAddress,
    privateKey: keyPair.privateKey,
    publicKeyJwk,
    deviceLabel,
    createdAt: new Date().toISOString(),
  });

  return { publicKeyJwk, tempAddress };
}

/** Re-keys a just-generated signing key from its temp id to its real address. */
export async function finalizeSigningKeyAddress(
  tempAddress: string,
  realAddress: string,
): Promise<void> {
  const record = await getSigningKey(tempAddress);
  if (!record) return;
  await putSigningKey({ ...record, address: realAddress });
}

export async function hasAnySigningKey(): Promise<boolean> {
  const keys = await listSigningKeys();
  return keys.some((k) => !k.address.startsWith("pending:"));
}

export async function listLocalSigningAddresses(): Promise<string[]> {
  const keys = await listSigningKeys();
  return keys.filter((k) => !k.address.startsWith("pending:")).map((k) => k.address);
}

/** The address this device signs with by default — the first registered key. */
export async function getPrimarySigningAddress(): Promise<string | undefined> {
  const addresses = await listLocalSigningAddresses();
  return addresses[0];
}

/**
 * Signs a server-provided hash (base64) with the stored private key for
 * `address`. crypto.subtle.sign hashes its `data` argument internally before
 * signing (SHA-256, per ALG below) — so the backend must verify against
 * SHA-256(recordHashToSign), not recordHashToSign directly. See
 * cryptoutil.VerifyWebCryptoECDSA on the Go side.
 */
export async function signHashForAddress(address: string, hashB64: string): Promise<string> {
  const record = await getSigningKey(address);
  if (!record) {
    throw new Error("No local signing key found for this address on this device.");
  }
  // TS's DOM lib types crypto.subtle.sign's data param as BufferSource typed
  // to plain ArrayBuffer, which a Uint8Array<ArrayBufferLike> view doesn't
  // structurally satisfy — copy into a fresh ArrayBuffer-backed view.
  const message = Uint8Array.from(base64ToBytes(hashB64));
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    record.privateKey,
    message.buffer as ArrayBuffer,
  );
  return bytesToBase64(new Uint8Array(signature));
}
