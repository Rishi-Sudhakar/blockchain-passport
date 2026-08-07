import { Stack } from "expo-router";

/**
 * Without this, expo-router's Tabs auto-registers every file under
 * passports/ (index, new, [id]/index, [id]/edit) as its own top-level tab —
 * that's the "3 extra passport buttons" bug. Wrapping the whole subtree in
 * its own Stack collapses it back into the single "Passports" tab declared
 * in (tabs)/_layout.tsx, with list -> detail -> edit/new as normal pushes
 * inside it.
 */
export default function PassportsStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
