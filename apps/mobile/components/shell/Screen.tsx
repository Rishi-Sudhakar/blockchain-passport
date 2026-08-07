import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { AmbientBackground } from "./AmbientBackground";
import { colors } from "@/theme/tokens";

/**
 * Every screen's root container. React Navigation's native-stack renders
 * each screen in its own native view controller, so a "transparent"
 * contentStyle on the Stack does NOT let a sibling background (rendered once
 * in the root layout) show through — it just falls back to opaque white/
 * black depending on platform, which was the original "text not visible"
 * bug. Giving every screen its own explicit background fixes it regardless
 * of how the navigator composites screens.
 */
export function Screen({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return (
    <View style={[styles.root, style]}>
      <AmbientBackground />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg0 },
});
