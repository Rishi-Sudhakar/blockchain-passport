import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import { colors } from "@/theme/tokens";

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={styles.row}>
      {steps.map((step, i) => {
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return <Segment key={step} label={step} filled={state !== "upcoming"} active={state === "active"} />;
      })}
    </View>
  );
}

function Segment({ label, filled, active }: { label: string; filled: boolean; active: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(filled ? "100%" : "0%", { duration: 400 }),
  }));

  return (
    <View style={styles.segment}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedStyle]} />
      </View>
      <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  segment: { flex: 1, gap: 6 },
  track: { height: 5, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 999, backgroundColor: colors.accentTeal },
  label: { fontSize: 11, fontWeight: "500", color: colors.ink3 },
  labelActive: { color: colors.ink0 },
});
