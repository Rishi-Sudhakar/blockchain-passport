import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { TextField } from "@/components/ui/TextField";
import { useCertificationDecision, usePassportTransition } from "@/lib/api/hooks";
import type { Passport, PassportVersion, User } from "@/lib/api/types";
import { colors } from "@/theme/tokens";

export function PassportActions({
  passport,
  versions,
  user,
}: {
  passport: Passport;
  versions: PassportVersion[];
  user: User;
}) {
  const router = useRouter();
  const transition = usePassportTransition(passport.id);
  const decision = useCertificationDecision(passport.id);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOwnerOrg = user.organizationId === passport.organizationId;
  const isManufacturerOwner = (user.role === "manufacturer" || user.role === "admin") && isOwnerOrg;
  const isCertifier = user.role === "certifier" || user.role === "admin";
  const currentData = versions.at(-1)?.data;

  const runTransition = async (eventType: string) => {
    setError(null);
    try {
      await transition.mutateAsync({ eventType, data: currentData });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const runDecision = async (approve: boolean) => {
    setError(null);
    try {
      await decision.mutateAsync({ approve, notes });
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  const busy = transition.isPending || decision.isPending;

  if (passport.status === "draft" && isManufacturerOwner) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.rowGap}>
          <Button
            title="Edit draft"
            variant="glass"
            style={{ flex: 1 }}
            onPress={() => router.push(`/(tabs)/passports/${passport.id}/edit`)}
          />
          <Button title="Submit" style={{ flex: 1 }} loading={busy} onPress={() => runTransition("submit")} />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </GlassCard>
    );
  }

  if (passport.status === "submitted" && isCertifier) {
    return (
      <GlassCard style={styles.card}>
        <Text style={styles.label}>Certifier review</Text>
        <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="Compliance notes…" multiline />
        <View style={styles.rowGap}>
          <Button title="Reject" variant="danger" style={{ flex: 1 }} loading={busy} onPress={() => runDecision(false)} />
          <Button title="Approve" style={{ flex: 1 }} loading={busy} onPress={() => runDecision(true)} />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </GlassCard>
    );
  }

  if (passport.status === "submitted" && isManufacturerOwner) {
    return (
      <GlassCard>
        <Text style={styles.centerNote}>Awaiting certifier review.</Text>
      </GlassCard>
    );
  }

  if (passport.status === "certified" && isManufacturerOwner) {
    return (
      <GlassCard style={styles.card}>
        <Button title="Publish passport" loading={busy} onPress={() => runTransition("publish")} />
        {error && <Text style={styles.error}>{error}</Text>}
      </GlassCard>
    );
  }

  if ((passport.status === "published" || passport.status === "amended") && isManufacturerOwner) {
    return (
      <GlassCard style={styles.card}>
        <View style={styles.rowGap}>
          <Button
            title="Amend"
            variant="glass"
            style={{ flex: 1 }}
            onPress={() => router.push(`/(tabs)/passports/${passport.id}/edit`)}
          />
          <Button title="End of life" variant="danger" style={{ flex: 1 }} loading={busy} onPress={() => runTransition("end_of_life")} />
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
      </GlassCard>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  rowGap: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontWeight: "800", color: colors.ink2 },
  centerNote: { textAlign: "center", color: colors.ink2, fontSize: 13, fontWeight: "600" },
  error: { fontSize: 13, fontWeight: "700", color: colors.danger },
});
