import { Redirect, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Screen } from "@/components/shell/Screen";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth/session";
import { brutal, colors, radii } from "@/theme/tokens";

function BrandMark() {
  return (
    <Animated.View entering={FadeInUp.duration(600)} style={styles.brand}>
      <View style={styles.brandShadow} />
      <View style={styles.brandBadge}>
        <Text style={styles.brandGlyph}>◈</Text>
      </View>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const { user, isLoading } = useSession();
  const router = useRouter();

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accentTeal} />
      </Screen>
    );
  }

  if (user) return <Redirect href="/(tabs)/dashboard" />;

  return (
    <Screen style={styles.container}>
      <View style={styles.top} />
      <View style={styles.hero}>
        <BrandMark />
        <Animated.View entering={FadeInUp.duration(600).delay(100)} style={{ alignItems: "center", gap: 12 }}>
          <Text style={styles.title}>
            Every product,{"\n"}
            <Text style={{ color: colors.accentTeal }}>verifiably compliant.</Text>
          </Text>
          <Text style={styles.subtitle}>
            Issue digital product passports, get them certified, and verify chain of custody,
            secured by a tamper-evident ledger.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.actions}>
        <Button title="Pair this device" size="lg" onPress={() => router.push("/pair")} />
        <Button title="Verify a passport" size="lg" variant="glass" onPress={() => router.push("/verify")} />
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { flex: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 48, justifyContent: "space-between" },
  top: { height: 1 },
  hero: { alignItems: "center", gap: 28 },
  brand: { alignItems: "center" },
  brandShadow: {
    position: "absolute",
    top: brutal.shadowOffset,
    left: brutal.shadowOffset,
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    backgroundColor: colors.accentViolet,
  },
  brandBadge: {
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    backgroundColor: colors.accentTeal,
    borderWidth: brutal.borderWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brandGlyph: { fontSize: 40, color: colors.accentTealInk },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink0, textAlign: "center", lineHeight: 38 },
  subtitle: { fontSize: 15, color: colors.ink2, textAlign: "center", lineHeight: 22, maxWidth: 320 },
  actions: { gap: 12 },
});
