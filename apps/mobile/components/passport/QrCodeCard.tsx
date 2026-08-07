import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { brutal, colors } from "@/theme/tokens";

export function QrCodeCard({ publicCode }: { publicCode: string }) {
  const [copied, setCopied] = useState(false);
  // The web app owns the human-facing /verify/[code] page; the QR simply
  // encodes the raw code, which both the web and mobile scanners parse.
  const value = publicCode;

  const onCopy = async () => {
    await Clipboard.setStringAsync(publicCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.qrWrap}>
        {/* Foreground must be a dark color for the code to actually scan —
            this used to read colors.bg0, which was black under the old dark
            theme but is cream now, silently making the QR unreadable. */}
        <QRCode value={value} size={140} backgroundColor="#ffffff" color={colors.ink0} />
      </View>
      <Text style={styles.code}>{publicCode}</Text>
      <Text style={styles.hint}>Scan to verify this passport publicly</Text>
      <Button title={copied ? "Copied" : "Copy code"} size="sm" variant="glass" onPress={onCopy} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: 12 },
  qrWrap: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    borderWidth: brutal.borderWidth,
    borderColor: colors.border,
  },
  code: { fontFamily: "monospace", fontSize: 13, fontWeight: "700", color: colors.ink0 },
  hint: { fontSize: 12, color: colors.ink2 },
});
