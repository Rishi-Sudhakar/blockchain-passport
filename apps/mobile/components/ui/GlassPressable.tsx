import * as Haptics from "expo-haptics";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { GlassSurface } from "./GlassSurface";

interface GlassPressableProps {
  onPress?: () => void;
  tone?: "default" | "strong" | "subtle";
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  haptics?: boolean;
}

export function GlassPressable({
  onPress,
  tone,
  padded = true,
  style,
  children,
  haptics = true,
}: GlassPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => {
        if (haptics) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.97, { stiffness: 500, damping: 30 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 500, damping: 30 });
      }}
    >
      <Animated.View style={animatedStyle}>
        <GlassSurface tone={tone} radius="lg" style={[padded && { padding: 20 }, style]}>
          {children}
        </GlassSurface>
      </Animated.View>
    </Pressable>
  );
}
