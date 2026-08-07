import * as Haptics from "expo-haptics";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { brutal, colors, radii } from "@/theme/tokens";

interface GlassPressableProps {
  onPress?: () => void;
  tone?: "default" | "strong" | "subtle";
  shadowColor?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  haptics?: boolean;
}

const toneFill = { default: colors.bg1, strong: colors.bg2, subtle: colors.bg0 };

/**
 * The neo-brutalist tactile interaction: on press, the card's face slides
 * down-right to exactly cover its own shadow, then springs back on release.
 * The shadow itself is an absoluteFillObject sibling shifted via transform —
 * same fix as GlassSurface — so it's always exactly the face's size.
 */
export function GlassPressable({
  onPress,
  tone = "default",
  shadowColor = brutal.shadowColor,
  padded = true,
  style,
  children,
  haptics = true,
}: GlassPressableProps) {
  const offset = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }, { translateY: offset.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: shadowColor,
            borderRadius: radii.lg,
            transform: [{ translateX: brutal.shadowOffset }, { translateY: brutal.shadowOffset }],
          },
        ]}
      />
      <Pressable
        onPress={() => {
          if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onPressIn={() => (offset.value = withTiming(brutal.shadowOffset, { duration: 90 }))}
        onPressOut={() => (offset.value = withTiming(0, { duration: 120 }))}
      >
        <Animated.View
          style={[styles.face, { backgroundColor: toneFill[tone] }, padded && { padding: 18 }, animatedStyle, style]}
        >
          {children}
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  face: {
    borderRadius: radii.lg,
    borderWidth: brutal.borderWidth,
    borderColor: colors.border,
  },
});
