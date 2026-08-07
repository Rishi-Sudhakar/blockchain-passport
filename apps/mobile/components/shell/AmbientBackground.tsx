import { StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";

/**
 * Same idea as the web app's AmbientBackground: solid-color "light sources"
 * the glass panels appear to refract. React Native has no filter: blur() for
 * plain Views (unlike the web version, which blurs real DOM elements), so
 * these are large, very low-opacity solid circles rather than blurred ones —
 * softer edges would need an SVG blur filter, which react-native-svg doesn't
 * support reliably across platforms. Still no gradient anywhere.
 */
export function AmbientBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, styles.violet]} />
      <View style={[styles.blob, styles.teal]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 340,
  },
  violet: {
    top: -120,
    left: -100,
    backgroundColor: colors.accentViolet,
    opacity: 0.1,
  },
  teal: {
    top: -60,
    right: -120,
    backgroundColor: colors.accentTeal,
    opacity: 0.08,
  },
});
