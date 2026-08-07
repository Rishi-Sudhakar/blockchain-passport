import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
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
      await redeemPairingCode(code.trim().toUpperCase());
      await refetch();
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't pair this device. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  content: { gap: 20 },
  title: { fontSize: 26, fontWeight: "600", color: colors.ink0 },
  subtitle: { fontSize: 14, color: colors.ink2, lineHeight: 20 },
  input: {
    height: 64,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
    textAlign: "center",
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 8,
    color: colors.ink0,
  },
  error: { fontSize: 13, color: colors.danger },
});
