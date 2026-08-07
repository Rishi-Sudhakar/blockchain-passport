import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PassportDataSections } from "@/components/passport/PassportDataSections";
import { ApiError } from "@/lib/api/client";
import { usePublicPassport } from "@/lib/api/hooks";
import type { BatteryData } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { colors } from "@/theme/tokens";

export default function VerifyResultScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, isLoading, error } = usePublicPassport(code);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }

  if (error || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{notFound ? "No passport found for this code." : "Something went wrong."}</Text>
        <Button title="Try another code" variant="glass" onPress={() => router.replace("/verify")} />
      </View>
    );
  }

  const { passport, versions, chainVerify } = data;
  const currentData = versions.at(-1)?.data as BatteryData | undefined;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 }]}>
      <View
        style={[
          styles.verifyBanner,
          { backgroundColor: chainVerify.valid ? "rgba(53,214,138,0.12)" : "rgba(240,86,107,0.12)" },
        ]}
      >
        <Text style={{ fontSize: 22, color: chainVerify.valid ? colors.success : colors.danger }}>
          {chainVerify.valid ? "✓" : "!"}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: chainVerify.valid ? colors.success : colors.danger, fontWeight: "600", fontSize: 15 }}>
            {chainVerify.valid ? "Verified authentic" : "Integrity check failed"}
          </Text>
          <Text style={styles.bannerSub}>
            {chainVerify.valid
              ? `${chainVerify.length} ledger record${chainVerify.length === 1 ? "" : "s"}, no tampering detected.`
              : chainVerify.reason}
          </Text>
        </View>
      </View>

      <GlassCard style={styles.headerCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{currentData?.productIdentifier.batteryModel || "Digital product passport"}</Text>
          <Text style={styles.code}>{passport.publicCode}</Text>
          <Text style={styles.date}>Issued {formatDate(passport.createdAt)}</Text>
        </View>
        <StatusBadge status={passport.status} />
      </GlassCard>

      {currentData && <PassportDataSections data={currentData} />}

      <Text style={styles.link} onPress={() => router.replace("/verify")}>
        Verify another passport →
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 28 },
  notFound: { color: colors.ink1, fontSize: 15, textAlign: "center" },
  content: { paddingHorizontal: 20, gap: 16 },
  verifyBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, padding: 16 },
  bannerSub: { fontSize: 12, color: colors.ink2, marginTop: 2 },
  headerCard: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 18, fontWeight: "600", color: colors.ink0 },
  code: { fontSize: 13, color: colors.ink2, marginTop: 3, fontFamily: "monospace" },
  date: { fontSize: 12, color: colors.ink3, marginTop: 4 },
  link: { textAlign: "center", color: colors.ink3, fontSize: 13, paddingVertical: 12 },
});
