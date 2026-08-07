import { Platform } from "react-native";
import { authApi, identityApi } from "@/lib/api/resources";
import type { User } from "@/lib/api/types";
import { ensureLocalSigningKey, finalizeSigningKeyAddress } from "@/lib/crypto/signing";
import { saveSessionToken } from "@/lib/storage";

export function defaultDeviceLabel(): string {
  return Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android device" : "This device";
}

/**
 * Generates (if needed) and registers this device's signing key with the
 * backend. Safe to call multiple times — a no-op once the key already has an
 * address. Exposed standalone so the Profile screen can retry this if it
 * didn't complete during pairing (see redeemPairingCode).
 */
export async function ensureDeviceKeyRegistered(): Promise<void> {
  const { key, isNew } = await ensureLocalSigningKey();
  if (isNew || !key.address) {
    const signingKey = await identityApi.createSigningKey({
      deviceLabel: defaultDeviceLabel(),
      publicKeyJwk: key.publicKeyJwk,
    });
    await finalizeSigningKeyAddress(signingKey.address);
  }
}

/**
 * Redeems a pairing code minted by the web app's Profile page and stores the
 * resulting session token. Once the code is redeemed the user IS signed in —
 * that must not be undone by a later failure. Signing-key registration is
 * attempted immediately after, but a failure there is reported via
 * `deviceKeyReady: false` rather than thrown, so the caller doesn't tell the
 * user "pairing failed" when it actually succeeded (this was a real bug:
 * the old version threw on key-registration failure even though the session
 * token was already saved, leaving the user silently logged in with no
 * signing key until they happened to restart the app).
 */
export async function redeemPairingCode(code: string): Promise<{ user: User; deviceKeyReady: boolean }> {
  const { user, token } = await authApi.redeemDevicePairing(code);
  await saveSessionToken(token);

  try {
    await ensureDeviceKeyRegistered();
    return { user, deviceKeyReady: true };
  } catch (err) {
    console.warn("Paired successfully but device signing-key setup failed; can retry from Profile.", err);
    return { user, deviceKeyReady: false };
  }
}
