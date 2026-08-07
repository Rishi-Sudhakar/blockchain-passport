// Neo-brutalism (light variant, matching the reference designs) uses a flat
// cream background with zero decoration — all visual interest comes from the
// cards/buttons themselves. Kept as a component (rendering nothing) so
// Screen.tsx doesn't need to change if a future pass wants to bring texture
// back in.
export function AmbientBackground() {
  return null;
}
