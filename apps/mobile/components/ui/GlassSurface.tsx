import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import { brutal, colors, radii } from "@/theme/tokens";

type Tone = "default" | "strong" | "subtle";
type Radius = keyof typeof radii;

const toneFill: Record<Tone, string> = {
  default: colors.bg1,
  strong: colors.bg2,
  subtle: colors.bg0,
};

interface GlassSurfaceProps {
  tone?: Tone;
  radius?: Radius;
  /** Color of the solid block offset behind the card. Black by default. */
  shadowColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * The app's card material: a solid opaque fill, a thick black border, and a
 * hard-edged solid-color block offset behind it. The shadow is an
 * absoluteFillObject sibling (guaranteed pixel-identical size to the face,
 * whatever that size ends up being) shifted purely via `transform` — not a
 * manually-sized view with negative right/bottom insets, which could drift
 * out of sync with the face for anything whose size isn't fixed up front
 * (text-dependent buttons, etc.) and was the cause of the shadow
 * "artifacting" seen on some buttons.
 */
export function GlassSurface({
  tone = "default",
  radius = "lg",
  shadowColor = brutal.shadowColor,
  style,
  children,
}: GlassSurfaceProps) {
  return (
    <View style={styles.wrapper}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: shadowColor,
            borderRadius: radii[radius],
            transform: [{ translateX: brutal.shadowOffset }, { translateY: brutal.shadowOffset }],
          },
        ]}
      />
      <View
        style={[
          styles.face,
          { backgroundColor: toneFill[tone], borderRadius: radii[radius] },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // No fixed sizing — the face view (normal flow) defines the box; the
    // shadow view fills that exact same box, then shifts via transform.
  },
  face: {
    borderWidth: brutal.borderWidth,
    borderColor: colors.border,
  },
});
