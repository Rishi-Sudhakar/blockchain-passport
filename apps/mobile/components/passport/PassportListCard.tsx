import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { GlassPressable } from "@/components/ui/GlassPressable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Passport } from "@/lib/api/types";
import { colors } from "@/theme/tokens";
import { formatDate } from "@/lib/utils";

export function PassportListCard({ passport }: { passport: Passport }) {
  const router = useRouter();
  return (
    <GlassPressable onPress={() => router.push(`/(tabs)/passports/${passport.id}`)}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{passport.category === "battery" ? "Battery passport" : passport.category}</Text>
          <Text style={styles.code}>{passport.publicCode}</Text>
          <Text style={styles.date}>Updated {formatDate(passport.updatedAt)}</Text>
        </View>
        <StatusBadge status={passport.status} />
      </View>
    </GlassPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 15, fontWeight: "800", color: colors.ink0 },
  code: { fontSize: 12, color: colors.ink2, marginTop: 3, fontFamily: "monospace" },
  date: { fontSize: 12, color: colors.ink3, marginTop: 4 },
});
