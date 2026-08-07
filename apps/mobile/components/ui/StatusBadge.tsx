import { StyleSheet, Text, View } from "react-native";
import { brutal, colors, radii } from "@/theme/tokens";

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

// Text is always black — every fill here is bright/light enough that black
// reads clearly, matching the neo-brutalist convention (never white-on-color).
const config: Record<AnyStatus, { label: string; fill: string }> = {
  draft: { label: "Draft", fill: colors.bg2 },
  submitted: { label: "Awaiting review", fill: colors.warning },
  pending: { label: "Pending", fill: colors.warning },
  certified: { label: "Certified", fill: colors.success },
  approved: { label: "Approved", fill: colors.success },
  published: { label: "Published", fill: colors.accentTeal },
  amended: { label: "Amended", fill: colors.accentViolet },
  rejected: { label: "Rejected", fill: colors.danger },
  end_of_life: { label: "End of life", fill: colors.bg2 },
};

export function StatusBadge({ status }: { status: string }) {
  const c = config[status as AnyStatus] ?? { label: status, fill: colors.bg2 };
  return (
    <View style={[styles.badge, { backgroundColor: c.fill }]}>
      <Text style={styles.label}>{c.label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    borderWidth: brutal.borderWidth - 0.5,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3, color: colors.ink0 },
});
