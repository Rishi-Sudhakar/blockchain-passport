import type { StyleProp, ViewStyle } from "react-native";
import { GlassSurface } from "./GlassSurface";

interface GlassCardProps {
  tone?: "default" | "strong" | "subtle";
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GlassCard({ tone, padded = true, style, children }: GlassCardProps) {
  return (
    <GlassSurface tone={tone} radius="lg" style={[padded && { padding: 20 }, style]}>
      {children}
    </GlassSurface>
  );
}
