import * as Haptics from "expo-haptics";
import type { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { brutal, colors, radii } from "@/theme/tokens";

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
  /** Layout props (flex, alignSelf, margin, width…) for positioning this
   * button within its parent — NOT for overriding its own visual appearance. */
  style?: StyleProp<ViewStyle>;
}

const sizeHeight: Record<Size, number> = { sm: 40, md: 50, lg: 60 };
const sizeFont: Record<Size, number> = { sm: 13, md: 15, lg: 16 };
const sizePad: Record<Size, number> = { sm: 14, md: 20, lg: 28 };

// Solid color block, thick black border, hard black shadow — every variant
// except ghost. Text is always black on top of a bright fill, matching the
// reference language (never white-on-color).
const fill: Record<Variant, string> = {
  primary: colors.yellow,
  glass: colors.bg1,
  ghost: "transparent",
  danger: colors.danger,
};
const textColor: Record<Variant, string> = {
  primary: colors.yellowInk,
  glass: colors.ink0,
  ghost: colors.ink1,
  danger: colors.ink0,
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
  const offset = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }, { translateY: offset.value }],
  }));
  const isGhost = variant === "ghost";
  // A genuinely disabled (not just loading) button goes flat: muted fill,
  // muted border, no shadow. Using opacity here instead would only fade the
  // face — the solid black shadow sitting almost directly behind it would
  // still show through at full strength and the two would blend into a
  // muddy olive color, which is exactly the bug this avoids.
  const isFlat = disabled && !loading;

  return (
    // `style` (flex, alignSelf, margins…) lives on this outermost box, so it
    // participates correctly in the parent's flex layout — e.g. two buttons
    // side by side each passing style={{flex:1}} actually share the row
    // evenly. Previously this landed on the innermost animated face instead,
    // several layout levels too deep to have any effect on sibling sizing —
    // that mismatch was the real cause of the button "artifacting".
    <View style={[fullWidth && styles.fullWidth, style]}>
      <View style={styles.pressWrapper}>
        {!isGhost && !isFlat && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                height: sizeHeight[size],
                backgroundColor: brutal.shadowColor,
                borderRadius: radii.button,
                transform: [
                  { translateX: brutal.shadowOffsetSm },
                  { translateY: brutal.shadowOffsetSm },
                ],
              },
            ]}
          />
        )}
        <Pressable
          disabled={disabled || loading}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress?.();
          }}
          onPressIn={() => {
            if (!isGhost) offset.value = withTiming(brutal.shadowOffsetSm, { duration: 80 });
          }}
          onPressOut={() => {
            offset.value = withTiming(0, { duration: 120 });
          }}
        >
          <Animated.View
            style={[
              styles.face,
              {
                height: sizeHeight[size],
                paddingHorizontal: sizePad[size],
                backgroundColor: isFlat ? colors.bg2 : fill[variant],
                borderColor: isFlat ? colors.borderMuted : colors.border,
                borderWidth: isGhost ? 0 : brutal.borderWidth,
              },
              animatedStyle,
            ]}
          >
            {loading ? (
              <ActivityIndicator color={textColor[variant]} />
            ) : (
              <Text
                style={{
                  color: isFlat ? colors.ink3 : textColor[variant],
                  fontSize: sizeFont[size],
                  fontWeight: "800",
                }}
              >
                {title.toUpperCase()}
              </Text>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: "100%" },
  pressWrapper: {
    // Sized entirely by the face (normal flow); the shadow is an
    // absoluteFillObject sibling shifted via transform, so it always matches
    // the face's actual rendered width exactly.
  },
  face: {
    borderRadius: radii.button,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
