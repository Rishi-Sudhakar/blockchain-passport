import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/shell/Screen";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSigningKeys } from "@/lib/api/hooks";
import { identityApi } from "@/lib/api/resources";
import { ensureDeviceKeyRegistered } from "@/lib/auth/device-setup";
import { useSession } from "@/lib/auth/session";
import { getSigningKey } from "@/lib/storage";
import { formatDate, truncateMiddle } from "@/lib/utils";
import { colors } from "@/theme/tokens";

const roleLabel: Record<string, string> = {
  manufacturer: "Manufacturer",
  certifier: "Certifier",
  admin: "Admin",
  consumer: "Consumer",
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useSession();
  const { data: keys, isLoading, refetch } = useSigningKeys();
  const [localAddress, setLocalAddress] = useState<string | null>(null);
  const [fixingKey, setFixingKey] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  useEffect(() => {
    getSigningKey().then((k) => setLocalAddress(k?.address || null));
  }, [keys]);

  if (!user) return null;

  const deviceKeyReady = !!localAddress && keys?.some((k) => k.address === localAddress && !k.revokedAt);

  const onFinishSetup = async () => {
    setFixingKey(true);
    setFixError(null);
    try {
      await ensureDeviceKeyRegistered();
      const k = await getSigningKey();
      setLocalAddress(k?.address || null);
      await refetch();
    } catch (err) {
      setFixError(err instanceof Error ? err.message : "Couldn't set up this device. Try again.");
    } finally {
      setFixingKey(false);
    }
  };

  const onRevoke = async (id: string) => {
    await identityApi.revokeSigningKey(id);
    await refetch();
  };

  const onLogout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <TopBar title="Profile" />
        <View style={styles.content}>
          <GlassCard style={styles.headerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.name}>{user.displayName}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{roleLabel[user.role] ?? user.role}</Text>
              </View>
            </View>
          </GlassCard>

          {!isLoading && !deviceKeyReady && (
            <GlassCard style={{ gap: 10 }}>
              <Text style={styles.sectionTitle}>This device isn't fully set up</Text>
              <Text style={styles.hint}>
                You're signed in, but this device doesn't have a registered signing key yet, so it
                can't sign passport actions. Finish setup to fix that.
              </Text>
              {fixError && <Text style={styles.revoke}>{fixError}</Text>}
              <Button title="Finish device setup" loading={fixingKey} onPress={onFinishSetup} />
            </GlassCard>
          )}

          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>Signing keys</Text>
            <Text style={styles.hint}>
              Each device you pair gets its own key that notarizes the passport actions you take
              there. Keys never leave the device they were created on.
            </Text>
            {isLoading && (
              <GlassCard>
                <Text style={styles.hint}>Loading…</Text>
              </GlassCard>
            )}
            {keys?.map((key) => (
              <GlassCard key={key.id} style={styles.keyRow}>
                <View>
                  <Text style={styles.keyLabel}>
                    {key.deviceLabel} {key.address === localAddress && <Text style={styles.thisDevice}>(this device)</Text>}
                  </Text>
                  <Text style={styles.keyAddress}>{truncateMiddle(key.address, 10)}</Text>
                  <Text style={styles.keyDate}>Added {formatDate(key.createdAt)}</Text>
                </View>
                {key.revokedAt ? (
                  <StatusBadge status="end_of_life" />
                ) : (
                  <Text style={styles.revoke} onPress={() => onRevoke(key.id)}>
                    Revoke
                  </Text>
                )}
              </GlassCard>
            ))}
          </View>

          <Button title="Log out" variant="glass" onPress={onLogout} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 24 },
  headerCard: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentTeal,
    borderWidth: 2.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.accentTealInk },
  name: { fontSize: 16, fontWeight: "800", color: colors.ink0 },
  email: { fontSize: 13, color: colors.ink2, marginTop: 2 },
  roleChip: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.bg2,
    borderWidth: 1.5,
    borderColor: colors.borderMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleChipText: { fontSize: 11, fontWeight: "500", color: colors.ink1 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.ink0 },
  hint: { fontSize: 12, color: colors.ink3, lineHeight: 18 },
  keyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  keyLabel: { fontSize: 14, fontWeight: "500", color: colors.ink0 },
  thisDevice: { color: colors.ink3, fontWeight: "400" },
  keyAddress: { fontSize: 11, color: colors.ink3, fontFamily: "monospace", marginTop: 2 },
  keyDate: { fontSize: 11, color: colors.ink3, marginTop: 2 },
  revoke: { fontSize: 12, fontWeight: "500", color: colors.danger },
});
