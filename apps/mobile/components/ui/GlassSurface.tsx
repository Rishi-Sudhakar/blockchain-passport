import { BlurView } from "expo-blur";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { colors, radii } from "@/theme/tokens";

type Tone = "default" | "strong" | "subtle";
type Radius = keyof typeof radii;

const toneFill: Record<Tone, string> = {
  default: "rgba(255,255,255,0.05)",
  strong: "rgba(255,255,255,0.09)",
  subtle: "rgba(255,255,255,0.03)",
};

const toneBorder: Record<Tone, string> = {
  default: colors.glassBorder,
  strong: colors.glassBorderStrong,
  subtle: "rgba(255,255,255,0.07)",
};

interface GlassSurfaceProps {
  tone?: Tone;
  radius?: Radius;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * The app's liquid-glass material, native this time: a real BlurView
 * (UIVisualEffectView on iOS) instead of CSS backdrop-filter, a translucent
 * solid overlay for fill, a solid hairline border, and a 1px top highlight
 * standing in for what an inset box-shadow does on web. No gradients.
 */
export function GlassSurface({ tone = "default", radius = "lg", style, children }: GlassSurfaceProps) {
  return (
    <View style={[{ borderRadius: radii[radius], overflow: "hidden" }, style]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: toneFill[tone], borderWidth: 1, borderColor: toneBorder[tone], borderRadius: radii[radius] },
        ]}
      />
      <View style={styles.topHighlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.hairlineHighlight,
  },
});
