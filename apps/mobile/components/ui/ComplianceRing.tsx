import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/tokens";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ComplianceRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function ComplianceRing({ progress, size = 120, strokeWidth = 10, label, sublabel }: ComplianceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, { duration: 1000, easing: Easing.out(Easing.cubic) });
  }, [clamped, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.borderMuted} strokeWidth={strokeWidth} />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.yellow}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          {label && <Text style={styles.label}>{label}</Text>}
          {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 18, fontWeight: "800", color: colors.ink0 },
  sublabel: { fontSize: 11, color: colors.ink2, marginTop: 2 },
});
