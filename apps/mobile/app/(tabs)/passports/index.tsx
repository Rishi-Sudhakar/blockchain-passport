import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PassportListCard } from "@/components/passport/PassportListCard";
import { usePassports } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/session";
import { colors } from "@/theme/tokens";

export default function PassportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSession();
  const { data: passports, isLoading } = usePassports();
  const canCreate = user?.role === "manufacturer" || user?.role === "admin";

  return (
    <Screen>
    <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <TopBar title="Passports" />
      <View style={styles.list}>
        {canCreate && (
          <Button title="+ New passport" variant="glass" onPress={() => router.push("/(tabs)/passports/new")} />
        )}
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
        {passports?.map((p) => <PassportListCard key={p.id} passport={p} />)}
      </View>
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 12 },
  empty: { textAlign: "center", color: colors.ink2, fontSize: 13 },
});
