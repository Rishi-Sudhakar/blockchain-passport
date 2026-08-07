import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/tokens";

type AnyStatus =
  | "draft"
  | "submitted"
  | "certified"
  | "published"
  | "amended"
  | "end_of_life"
  | "pending"
  | "approved"
  | "rejected";

const config: Record<AnyStatus, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: colors.ink1, bg: "rgba(255,255,255,0.08)" },
  submitted: { label: "Awaiting review", color: colors.warning, bg: "rgba(242,184,75,0.15)" },
  pending: { label: "Pending", color: colors.warning, bg: "rgba(242,184,75,0.15)" },
  certified: { label: "Certified", color: colors.success, bg: "rgba(53,214,138,0.15)" },
  approved: { label: "Approved", color: colors.success, bg: "rgba(53,214,138,0.15)" },
  published: { label: "Published", color: colors.accentTeal, bg: "rgba(46,230,209,0.15)" },
  amended: { label: "Amended", color: colors.accentViolet, bg: "rgba(139,124,245,0.15)" },
  rejected: { label: "Rejected", color: colors.danger, bg: "rgba(240,86,107,0.15)" },
  end_of_life: { label: "End of life", color: colors.ink2, bg: "rgba(255,255,255,0.06)" },
};

export function StatusBadge({ status }: { status: string }) {
  const c = config[status as AnyStatus] ?? { label: status, color: colors.ink1, bg: "rgba(255,255,255,0.08)" };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.dot, { backgroundColor: c.color }]} />
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.2 },
});
