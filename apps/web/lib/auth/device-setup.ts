import { identityApi } from "@/lib/api/resources";
import type { SigningKey } from "@/lib/api/types";
import { finalizeSigningKeyAddress, generateAndStoreSigningKey } from "@/lib/crypto/signing";

/**
 * Generates a device-local signing keypair, registers its public key with the
 * backend (which derives the address), and re-keys local storage under the
 * real address. Shared by the post-registration onboarding step and the
 * "add this device" action on the profile page.
 */
export async function setupSigningKeyForThisDevice(deviceLabel: string): Promise<SigningKey> {
  const { publicKeyJwk, tempAddress } = await generateAndStoreSigningKey(deviceLabel);
  const signingKey = await identityApi.createSigningKey({ deviceLabel, publicKeyJwk });
  await finalizeSigningKeyAddress(tempAddress, signingKey.address);
  return signingKey;
}

export function defaultDeviceLabel(): string {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  return "This device";
}
