import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "@/components/ui/GlassCard";
import type { LedgerRecord, VerifyResult } from "@/lib/api/types";
import { colors } from "@/theme/tokens";
import { formatDateTime, truncateMiddle } from "@/lib/utils";

const eventLabels: Record<string, string> = {
  submit: "Submitted for certification",
  certify_approve: "Certified",
  certify_reject: "Certification rejected",
  publish: "Published",
  amend: "Amended",
  end_of_life: "Marked end of life",
};

export function ChainOfCustodyTimeline({ records, verify }: { records: LedgerRecord[]; verify?: VerifyResult }) {
  return (
    <View style={{ gap: 12 }}>
      {verify && (
        <View style={[styles.verifyBanner, { backgroundColor: verify.valid ? "rgba(53,214,138,0.12)" : "rgba(240,86,107,0.12)" }]}>
          <Text style={{ fontSize: 16, color: verify.valid ? colors.success : colors.danger }}>{verify.valid ? "✓" : "!"}</Text>
          <Text style={[styles.verifyText, { color: verify.valid ? colors.success : colors.danger }]}>
            {verify.valid
              ? `Chain verified — ${verify.length} record${verify.length === 1 ? "" : "s"}, no tampering detected.`
              : `Integrity check failed at record #${verify.brokenAt}: ${verify.reason}`}
          </Text>
        </View>
      )}

      {records.length === 0 && (
        <GlassCard>
          <Text style={styles.empty}>No ledger entries yet — this passport is still a private draft.</Text>
        </GlassCard>
      )}

      <View style={{ gap: 16 }}>
        {records.map((rec, i) => (
          <View key={rec.id} style={styles.item}>
            <View style={styles.dotColumn}>
              <View style={styles.dot} />
              {i < records.length - 1 && <View style={styles.connector} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventLabel}>{eventLabels[rec.eventType] ?? rec.eventType}</Text>
              <Text style={styles.meta}>
                {formatDateTime(rec.signedAt)} · signed by {truncateMiddle(rec.signerAddress, 8)}
              </Text>
              <Text style={styles.hash}>
                #{rec.sequenceNum} · {truncateMiddle(rec.recordHash, 10)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  verifyBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 16, padding: 14 },
  verifyText: { fontSize: 13, fontWeight: "500", flex: 1 },
  empty: { textAlign: "center", color: colors.ink2, fontSize: 13 },
  item: { flexDirection: "row", gap: 12 },
  dotColumn: { alignItems: "center", width: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentTeal },
  connector: { width: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.12)", marginTop: 4, minHeight: 28 },
  eventLabel: { fontSize: 14, fontWeight: "500", color: colors.ink0 },
  meta: { fontSize: 12, color: colors.ink3, marginTop: 2 },
  hash: { fontSize: 11, color: colors.ink3, marginTop: 2, fontFamily: "monospace" },
});
