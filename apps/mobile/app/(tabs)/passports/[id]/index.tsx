import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ChainOfCustodyTimeline } from "@/components/passport/ChainOfCustodyTimeline";
import { PassportActions } from "@/components/passport/PassportActions";
import { PassportDataSections } from "@/components/passport/PassportDataSections";
import { QrCodeCard } from "@/components/passport/QrCodeCard";
import { usePassport, usePassportLedger, usePassportLedgerVerify } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";
import { colors } from "@/theme/tokens";
import type { BatteryData } from "@/lib/api/types";

export default function PassportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { data, isLoading } = usePassport(id);
  const { data: ledger } = usePassportLedger(id);
  const { data: verify } = usePassportLedgerVerify(id);

  if (isLoading || !data) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accentTeal} />
      </Screen>
    );
  }

  const { passport, versions } = data;
  const currentData = versions.at(-1)?.data as BatteryData | undefined;

  return (
    <Screen>
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <TopBar title="Passport" />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{currentData?.productIdentifier.batteryModel || "Untitled battery"}</Text>
            <Text style={styles.code}>{passport.publicCode}</Text>
            <Text style={styles.date}>Created {formatDate(passport.createdAt)}</Text>
          </View>
          <StatusBadge status={passport.status} />
        </View>

        {user && <PassportActions passport={passport} versions={versions} user={user} />}

        <QrCodeCard publicCode={passport.publicCode} />

        {currentData && (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>Compliance data</Text>
            <PassportDataSections data={currentData} />
          </View>
        )}

        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Chain of custody</Text>
          <ChainOfCustodyTimeline records={ledger ?? []} verify={verify} />
        </View>
      </View>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, gap: 20 },
  header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 20, fontWeight: "800", color: colors.ink0 },
  code: { fontSize: 13, color: colors.ink2, marginTop: 3, fontFamily: "monospace" },
  date: { fontSize: 12, color: colors.ink3, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.ink0 },
});
