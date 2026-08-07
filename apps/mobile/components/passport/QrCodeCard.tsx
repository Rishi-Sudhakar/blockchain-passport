import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { API_URL } from "@/lib/api/client";
import { colors } from "@/theme/tokens";

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
        <QRCode value={value} size={140} backgroundColor="#ffffff" color={colors.bg0} />
      </View>
      <Text style={styles.code}>{publicCode}</Text>
      <Text style={styles.hint}>Scan to verify this passport publicly</Text>
      <Button title={copied ? "Copied" : "Copy code"} size="sm" variant="glass" onPress={onCopy} />
      <Text style={styles.apiHint}>{API_URL}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", gap: 12 },
  qrWrap: { backgroundColor: "#fff", padding: 12, borderRadius: 16 },
  code: { fontFamily: "monospace", fontSize: 13, color: colors.ink1 },
  hint: { fontSize: 12, color: colors.ink3 },
  apiHint: { fontSize: 10, color: colors.ink3, opacity: 0.6 },
});
