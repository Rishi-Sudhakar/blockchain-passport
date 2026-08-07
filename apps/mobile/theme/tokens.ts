// Light neo-brutalism: warm cream background, solid white cards, thick black
// borders, hard black offset shadows, bold saturated color blocks. No blur,
// no gradients anywhere — depth comes entirely from the border + shadow, not
// translucency. Keeping the original token names (bg0, accentTeal, ...) even
// though the palette flipped from dark to light, since every screen already
// references them by name — only the values (and which color plays "primary"
// vs "secondary") changed.
export const colors = {
  bg0: "#F4EEE2",
  bg1: "#FFFFFF",
  bg2: "#FBF6EA",

  ink0: "#16171B",
  ink1: "#44464E",
  ink2: "#6C6E77",
  ink3: "#93959E",

  // Yellow is the primary CTA color now (matches the reference language);
  // teal remains a secondary accent (status chips, chain-of-custody marks).
  yellow: "#FFCB3D",
  yellowInk: "#16171B",
  accentTeal: "#3FE0C9",
  accentTealInk: "#16171B",
  accentViolet: "#8B7CF5",

  success: "#5FD98A",
  warning: "#FF9F43",
  danger: "#FF5E62",

  border: "#16171B",
  borderMuted: "rgba(22,23,27,0.2)",
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  button: 16,
  pill: 999,
} as const;

// Shared geometry for the hard offset shadow: solid black, same offset,
// everywhere — cards, buttons, chips, the tab bar.
export const brutal = {
  borderWidth: 2.5,
  shadowOffset: 6,
  shadowOffsetSm: 4,
  shadowColor: "#16171B",
} as const;

export const spacing = (n: number) => n * 4;
