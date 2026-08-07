// The TypeScript version bundled here predates the WebAuthn Level 3 JSON
// serialization helpers, so we extend just the instance side ourselves (safe
// interface merge — adds a member, doesn't redeclare the existing global).
// The static side (parseCreationOptionsFromJSON / parseRequestOptionsFromJSON)
// is accessed via a local cast in lib/crypto/webauthn.ts instead, to avoid
// redeclaring the `PublicKeyCredential` global var itself. These are real,
// shipped browser APIs (Chrome 122+, Safari 18+, Firefox 122+) — see
// https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredential/parseCreationOptionsFromJSON

interface PublicKeyCredential {
  toJSON(): Record<string, unknown>;
}
