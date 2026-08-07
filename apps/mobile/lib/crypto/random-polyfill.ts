// Hermes (React Native's JS engine) has no Web Crypto API, so
// @noble/curves/@noble/hashes' randomness helpers throw "crypto.getRandomValues
// must be defined" the moment we try to generate a signing key. We can't use
// the usual `react-native-get-random-values` package here because it ships
// native code that isn't precompiled into Expo Go — anything not part of the
// Expo SDK simply won't load without a custom dev client. `expo-crypto` IS
// part of the Expo SDK (works in Expo Go) and exposes a `getRandomValues`
// with the same fill-in-place signature as the real Web Crypto API, so we
// wire that up as the polyfill instead. Must be imported before anything
// that might call crypto.getRandomValues — see app/_layout.tsx.
import { getRandomValues } from "expo-crypto";

const globalAny = global as unknown as { crypto?: Crypto };

if (!globalAny.crypto) {
  globalAny.crypto = {} as Crypto;
}
if (typeof globalAny.crypto.getRandomValues !== "function") {
  // expo-crypto's signature matches Crypto.getRandomValues closely enough
  // for @noble's usage (fills and returns the passed typed array).
  globalAny.crypto.getRandomValues = getRandomValues as unknown as Crypto["getRandomValues"];
}
