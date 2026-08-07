import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import type { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { colors, radii } from "@/theme/tokens";

type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const sizeHeight: Record<Size, number> = { sm: 36, md: 44, lg: 56 };
const sizeFont: Record<Size, number> = { sm: 14, md: 15, lg: 16 };
const sizePad: Record<Size, number> = { sm: 14, md: 20, lg: 28 };

// Every variant is the same glass material, tinted differently — no colored
// glow shadow on any of them, matching the web app.
const tint: Record<Variant, { fill: string; border: string; text: string }> = {
  primary: { fill: "rgba(46,230,209,0.16)", border: "rgba(46,230,209,0.4)", text: colors.accentTeal },
  glass: { fill: "rgba(255,255,255,0.08)", border: colors.glassBorderStrong, text: colors.ink0 },
  ghost: { fill: "transparent", border: "transparent", text: colors.ink1 },
  danger: { fill: "rgba(240,86,107,0.16)", border: "rgba(240,86,107,0.4)", text: colors.danger },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  fullWidth,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const t = tint[variant];
  const isGhost = variant === "ghost";

  return (
    <Animated.View style={[animatedStyle, fullWidth && { width: "100%" }, style]}>
      <Pressable
        disabled={disabled || loading}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onPressIn={() => (scale.value = withSpring(0.96, { stiffness: 500, damping: 30 }))}
        onPressOut={() => (scale.value = withSpring(1, { stiffness: 500, damping: 30 }))}
        style={{
          height: sizeHeight[size],
          borderRadius: radii.pill,
          overflow: "hidden",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {!isGhost && <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: t.fill,
              borderWidth: isGhost ? 0 : 1,
              borderColor: t.border,
              borderRadius: radii.pill,
            },
          ]}
        />
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: sizePad[size],
            gap: 8,
          }}
        >
          {loading ? (
            <ActivityIndicator color={t.text} />
          ) : (
            <Text style={{ color: t.text, fontSize: sizeFont[size], fontWeight: "600" }}>{title}</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
