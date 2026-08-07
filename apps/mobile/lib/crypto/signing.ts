import { p256 } from "@noble/curves/nist.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { getSigningKey, saveSigningKey, type StoredSigningKey } from "@/lib/storage";
import { base64ToBase64Url, base64ToBytes, bytesToBase64, bytesToHex, hexToBytes } from "./base64";

function jwkFromPublicKeyBytes(pub: Uint8Array): Record<string, string> {
  // Uncompressed SEC1 point: 0x04 || X(32) || Y(32).
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  return {
    kty: "EC",
    crv: "P-256",
    x: base64ToBase64Url(bytesToBase64(x)),
    y: base64ToBase64Url(bytesToBase64(y)),
  };
}

/**
 * Generates this device's ECDSA P-256 signing key (if it doesn't have one
 * yet) and returns its public JWK for registration with the backend, which
 * derives the address. Mirrors the web app's WebCrypto-based flow, but with
 * @noble/curves since RN/Hermes has no Web Crypto asymmetric-key support.
 */
export async function ensureLocalSigningKey(): Promise<{
  key: StoredSigningKey;
  isNew: boolean;
}> {
  const existing = await getSigningKey();
  if (existing) return { key: existing, isNew: false };

  const privateKeyBytes = p256.utils.randomSecretKey();
  const publicKeyBytes = p256.getPublicKey(privateKeyBytes, false);
  const key: StoredSigningKey = {
    address: "", // filled in once the backend derives + returns it
    privateKeyHex: bytesToHex(privateKeyBytes),
    publicKeyJwk: jwkFromPublicKeyBytes(publicKeyBytes),
  };
  await saveSigningKey(key);
  return { key, isNew: true };
}

export async function finalizeSigningKeyAddress(address: string): Promise<void> {
  const key = await getSigningKey();
  if (!key) return;
  await saveSigningKey({ ...key, address });
}

/**
 * Signs a server-provided hash (base64). @noble/curves' sign() takes the
 * digest directly with no internal hashing, so to match the backend's
 * cryptoutil.VerifyWebCryptoECDSA (which expects SHA-256(message) — the
 * convention forced by the *web* client's use of WebCrypto, which always
 * hashes internally) we replicate that hash step explicitly here.
 */
export async function signHash(hashB64: string): Promise<{ signature: string; address: string }> {
  const key = await getSigningKey();
  if (!key || !key.address) {
    throw new Error("This device doesn't have a registered signing key yet.");
  }
  const message = base64ToBytes(hashB64);
  const digest = sha256(message);
  const privateKeyBytes = hexToBytes(key.privateKeyHex);
  const signature = p256.sign(digest, privateKeyBytes);
  return { signature: bytesToBase64(signature), address: key.address };
}
