import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Screen } from "@/components/shell/Screen";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { redeemPairingCode } from "@/lib/auth/device-setup";
import { useSession } from "@/lib/auth/session";
import { colors, radii } from "@/theme/tokens";

export default function PairScreen() {
  const router = useRouter();
  const { refetch } = useSession();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPair = async () => {
    if (code.trim().length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const { deviceKeyReady } = await redeemPairingCode(code.trim().toUpperCase());
      await refetch();
      if (!deviceKeyReady) {
        // Already signed in at this point — don't block on this, just let
        // them in; Profile has a "Finish device setup" fallback for this.
        console.warn("Paired, but this device's signing key still needs setup — see Profile.");
      }
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't pair this device. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View entering={FadeInUp.duration(500)} style={styles.content}>
          <Text style={styles.title}>Pair this device</Text>
          <Text style={styles.subtitle}>
            On your computer, open the web app → Profile → &ldquo;Pair the mobile app&rdquo;, and
            enter the 6-character code shown there.
          </Text>

          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase().slice(0, 6))}
            placeholder="XXXXXX"
            placeholderTextColor={colors.ink3}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button title="Pair device" size="lg" loading={loading} disabled={code.length < 6} onPress={onPair} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  content: { gap: 20 },
  title: { fontSize: 26, fontWeight: "800", color: colors.ink0 },
  subtitle: { fontSize: 14, color: colors.ink2, lineHeight: 20 },
  input: {
    height: 64,
    borderRadius: radii.md,
    borderWidth: 2.5,
    borderColor: colors.border,
    backgroundColor: colors.bg1,
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 8,
    color: colors.ink0,
  },
  error: { fontSize: 13, fontWeight: "700", color: colors.danger },
});
