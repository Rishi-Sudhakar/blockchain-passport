// Thin wrapper around the browser's native WebAuthn JSON serialization
// helpers (see webauthn-dom.d.ts for why these need an ambient declaration).
// go-webauthn's protocol package emits/consumes exactly the W3C spec's JSON
// dictionaries, so no manual base64url<->ArrayBuffer conversion is needed.

type StaticJSONHelpers = {
  parseCreationOptionsFromJSON(options: Record<string, unknown>): PublicKeyCredentialCreationOptions;
  parseRequestOptionsFromJSON(options: Record<string, unknown>): PublicKeyCredentialRequestOptions;
};

function jsonHelpers(): StaticJSONHelpers {
  return PublicKeyCredential as unknown as StaticJSONHelpers;
}

export function isWebAuthnJSONSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof PublicKeyCredential !== "undefined" &&
    typeof (PublicKeyCredential as unknown as StaticJSONHelpers).parseCreationOptionsFromJSON ===
      "function"
  );
}

export async function createPasskey(
  optionsJSON: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const publicKey = jsonHelpers().parseCreationOptionsFromJSON(optionsJSON);
  const credential = await navigator.credentials.create({ publicKey });
  if (!credential) throw new Error("No credential was created");
  return (credential as unknown as PublicKeyCredential).toJSON();
}

export async function getPasskeyAssertion(
  optionsJSON: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const publicKey = jsonHelpers().parseRequestOptionsFromJSON(optionsJSON);
  const credential = await navigator.credentials.get({ publicKey });
  if (!credential) throw new Error("No credential was returned");
  return (credential as unknown as PublicKeyCredential).toJSON();
}
