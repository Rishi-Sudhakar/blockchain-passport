import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "@/components/shell/TopBar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassPressable } from "@/components/ui/GlassPressable";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCertificationQueue } from "@/lib/api/hooks";
import { formatDate } from "@/lib/utils";
import { colors } from "@/theme/tokens";

export default function CertificationQueueScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: items, isLoading } = useCertificationQueue();

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <TopBar title="Certification queue" />
      <View style={styles.list}>
        {isLoading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
        {!isLoading && (items?.length ?? 0) === 0 && (
          <GlassCard>
            <Text style={styles.empty}>Nothing waiting for review right now.</Text>
          </GlassCard>
        )}
        {items?.map((item) => (
          <GlassPressable key={item.certification.id} onPress={() => router.push(`/(tabs)/passports/${item.passport.id}`)}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {item.passport.category === "battery" ? "Battery passport" : item.passport.category}
                </Text>
                <Text style={styles.code}>{item.passport.publicCode}</Text>
                <Text style={styles.date}>Submitted {formatDate(item.certification.createdAt)}</Text>
              </View>
              <StatusBadge status={item.certification.status} />
            </View>
          </GlassPressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 12 },
  empty: { textAlign: "center", color: colors.ink2, fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 15, fontWeight: "600", color: colors.ink0 },
  code: { fontSize: 12, color: colors.ink2, marginTop: 3, fontFamily: "monospace" },
  date: { fontSize: 12, color: colors.ink3, marginTop: 4 },
});
