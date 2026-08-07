import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/shell/Screen";
import { Button } from "@/components/ui/Button";
import { ComplianceRing } from "@/components/ui/ComplianceRing";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassPressable } from "@/components/ui/GlassPressable";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PassportListCard } from "@/components/passport/PassportListCard";
import { useCertificationQueue, usePassports } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { colors } from "@/theme/tokens";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const { data: passports, isLoading } = usePassports();
  const isCertifier = user?.role === "certifier" || user?.role === "admin";
  const { data: queue } = useCertificationQueue();

  const published = passports?.filter((p) => p.status === "published" || p.status === "amended").length ?? 0;
  const total = passports?.length ?? 0;
  const progress = total > 0 ? published / total : 0;

  return (
    <Screen>
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
    >
      <Text style={styles.greeting}>Hi, {user?.displayName.split(" ")[0]}</Text>

      {!isCertifier && (
        <GlassCard style={styles.summaryCard}>
          <ComplianceRing progress={progress} size={88} strokeWidth={8} label={`${published}/${total}`} sublabel="published" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryBody}>
              {total === 0
                ? "Issue your first digital product passport to get started."
                : `${published} of ${total} passports are live and verifiable.`}
            </Text>
            <Button title="New passport" size="sm" onPress={() => router.push("/(tabs)/passports/new")} style={{ alignSelf: "flex-start" }} />
          </View>
        </GlassCard>
      )}

      {isCertifier && (
        <GlassPressable onPress={() => router.push("/(tabs)/certification")}>
          <View style={styles.queueRow}>
            <View>
              <Text style={styles.queueTitle}>Certification queue</Text>
              <Text style={styles.queueSubtitle}>Passports awaiting your review</Text>
            </View>
            <View style={styles.queueBadge}>
              <Text style={styles.queueBadgeText}>{queue?.length ?? 0}</Text>
            </View>
          </View>
        </GlassPressable>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent passports</Text>
      </View>

      <View style={{ gap: 12 }}>
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
        {!isLoading && (passports?.length ?? 0) === 0 && (
          <GlassCard>
            <Text style={styles.empty}>No passports yet.</Text>
          </GlassCard>
        )}
        {passports?.slice(0, 4).map((p) => <PassportListCard key={p.id} passport={p} />)}
      </View>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 20 },
  greeting: { fontSize: 24, fontWeight: "800", color: colors.ink0 },
  summaryCard: { flexDirection: "row", alignItems: "center", gap: 16 },
  summaryText: { flex: 1, gap: 10 },
  summaryBody: { fontSize: 13, color: colors.ink1, lineHeight: 19 },
  queueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  queueTitle: { fontSize: 15, fontWeight: "800", color: colors.ink0 },
  queueSubtitle: { fontSize: 13, color: colors.ink2, marginTop: 2 },
  queueBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warning,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  queueBadgeText: { color: colors.bg0, fontWeight: "800", fontSize: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.ink0 },
  empty: { textAlign: "center", color: colors.ink2, fontSize: 13 },
});
