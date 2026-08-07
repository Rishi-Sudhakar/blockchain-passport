import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "passport.sessionToken";
const SIGNING_KEY_KEY = "passport.signingKey";

export interface StoredSigningKey {
  address: string;
  privateKeyHex: string; // raw 32-byte P-256 scalar, hex-encoded
  publicKeyJwk: Record<string, string>;
}

// expo-secure-store backs onto iOS Keychain / Android Keystore-encrypted
// prefs — encrypted at rest and scoped to this app, though (unlike a
// hardware-backed non-extractable key) the raw bytes are readable by this
// app's own process. A reasonable tradeoff for a demo; a production build
// would look at Secure Enclave-backed key generation instead.
export async function saveSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function clearSessionToken(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}

export async function saveSigningKey(key: StoredSigningKey): Promise<void> {
  await SecureStore.setItemAsync(SIGNING_KEY_KEY, JSON.stringify(key));
}

export async function getSigningKey(): Promise<StoredSigningKey | null> {
  const raw = await SecureStore.getItemAsync(SIGNING_KEY_KEY);
  return raw ? (JSON.parse(raw) as StoredSigningKey) : null;
}

export async function clearSigningKey(): Promise<void> {
  await SecureStore.deleteItemAsync(SIGNING_KEY_KEY);
}
