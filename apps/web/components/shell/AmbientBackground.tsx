/**
 * Neo-brutalism uses a flat solid background, not soft-focus light sources —
 * this is now a no-op kept so call sites don't need to change.
 */
export function AmbientBackground() {
  return null;
}
