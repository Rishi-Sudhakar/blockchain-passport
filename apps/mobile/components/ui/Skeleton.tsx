import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { colors } from "@/theme/tokens";
import { GlassCard } from "./GlassCard";

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ borderRadius: 14, backgroundColor: colors.borderMuted }, animatedStyle, style]}
    />
  );
}

export function SkeletonCard() {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <Skeleton style={{ height: 14, width: 100 }} />
        <Skeleton style={{ height: 20, width: 70, borderRadius: 999 }} />
      </View>
      <Skeleton style={{ height: 22, width: "70%" }} />
      <Skeleton style={{ height: 14, width: "45%" }} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
