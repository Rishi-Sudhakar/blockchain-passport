import type { StyleProp, ViewStyle } from "react-native";
import { GlassSurface } from "./GlassSurface";

interface GlassCardProps {
  tone?: "default" | "strong" | "subtle";
  shadowColor?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GlassCard({ tone, shadowColor, padded = true, style, children }: GlassCardProps) {
  return (
    <GlassSurface tone={tone} radius="lg" shadowColor={shadowColor} style={[padded && { padding: 18 }, style]}>
      {children}
    </GlassSurface>
  );
}
