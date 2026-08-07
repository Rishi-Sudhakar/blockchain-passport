// Mirrors apps/web/app/globals.css exactly — same palette, same "no gradients,
// no colored glows" rule. Native glass here comes from expo-blur's BlurView
// (a real UIVisualEffectView on iOS) rather than CSS backdrop-filter.
export const colors = {
  bg0: "#05070a",
  bg1: "#0b0f16",
  bg2: "#11161f",

  ink0: "#f5f7fa",
  ink1: "#c7ccd6",
  ink2: "#8b93a3",
  ink3: "#5b6272",

  accentTeal: "#2ee6d1",
  accentTealInk: "#04211d",
  accentViolet: "#8b7cf5",

  success: "#35d68a",
  warning: "#f2b84b",
  danger: "#f0566b",

  glassBorder: "rgba(255,255,255,0.12)",
  glassBorderStrong: "rgba(255,255,255,0.2)",
  glassFillLight: "rgba(255,255,255,0.06)",
  glassFillStrong: "rgba(255,255,255,0.1)",
  hairlineHighlight: "rgba(255,255,255,0.16)",
} as const;

export const radii = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 32,
  pill: 999,
} as const;

export const spacing = (n: number) => n * 4;
