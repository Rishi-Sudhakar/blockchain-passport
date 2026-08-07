import { Stack } from "expo-router";

// Same reasoning as passports/_layout.tsx — keeps this tab's subtree
// collapsed into one tab bar entry even as more screens get added under it.
export default function CertificationStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
