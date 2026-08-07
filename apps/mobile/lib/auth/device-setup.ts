import { Platform } from "react-native";
import { authApi, identityApi } from "@/lib/api/resources";
import type { User } from "@/lib/api/types";
import { ensureLocalSigningKey, finalizeSigningKeyAddress } from "@/lib/crypto/signing";
import { saveSessionToken } from "@/lib/storage";

export function defaultDeviceLabel(): string {
  return Platform.OS === "ios" ? "iPhone" : Platform.OS === "android" ? "Android device" : "This device";
}

/**
 * Redeems a pairing code minted by the web app's Profile page, stores the
 * resulting session token, and ensures this device has a registered signing
 * key — generating and registering one if this is its first time pairing.
 */
export async function redeemPairingCode(code: string): Promise<User> {
  const { user, token } = await authApi.redeemDevicePairing(code);
  await saveSessionToken(token);

  const { key, isNew } = await ensureLocalSigningKey();
  if (isNew || !key.address) {
    const signingKey = await identityApi.createSigningKey({
      deviceLabel: defaultDeviceLabel(),
      publicKeyJwk: key.publicKeyJwk,
    });
    await finalizeSigningKeyAddress(signingKey.address);
  }

  return user;
}
