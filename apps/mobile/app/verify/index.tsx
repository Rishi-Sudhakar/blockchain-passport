import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/components/shell/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { colors, radii } from "@/theme/tokens";

export default function VerifyLandingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Web's QR encodes a full verify URL; the mobile app's own QR encodes just
  // the raw code. Scanning either one (e.g. a code shown on a laptop screen)
  // needs to work, so unwrap a URL down to its last path segment if we get
  // one — plain string splitting rather than the URL API, which isn't
  // guaranteed available in Hermes without a polyfill we don't otherwise need.
  const extractCode = (raw: string): string => {
    const trimmed = raw.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      const parts = trimmed.split("/").filter(Boolean);
      return parts.at(-1) ?? trimmed;
    }
    return trimmed;
  };

  const goToCode = (raw: string) => {
    const clean = extractCode(raw);
    if (clean) router.push(`/verify/${encodeURIComponent(clean)}`);
  };

  const onScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setScanned(false);
    setScanning(true);
  };

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => {
            if (scanned) return;
            setScanned(true);
            setScanning(false);
            goToCode(data);
          }}
        />
        <View style={styles.scanFrame} />
        <TouchableOpacity style={[styles.cancelBtn, { top: insets.top + 20 }]} onPress={() => setScanning(false)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Screen style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Verify a passport</Text>
        <Text style={styles.subtitle}>Scan a QR code or enter a passport code.</Text>
      </View>

      <Button title="Scan QR code" size="lg" onPress={onScan} />

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      <View style={{ gap: 12 }}>
        <TextField label="Passport code" value={code} onChangeText={setCode} placeholder="BP-XXXXX-XXXXX" autoCapitalize="none" />
        <Button title="Look up" size="lg" variant="glass" disabled={!code.trim()} onPress={() => goToCode(code)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 28, gap: 24 },
  title: { fontSize: 24, fontWeight: "800", color: colors.ink0, textAlign: "center" },
  subtitle: { fontSize: 14, color: colors.ink2, textAlign: "center" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: colors.borderMuted },
  dividerText: { fontSize: 12, color: colors.ink3 },
  scannerContainer: { flex: 1, backgroundColor: "black" },
  scanFrame: {
    position: "absolute",
    top: "35%",
    left: "15%",
    width: "70%",
    height: "30%",
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },
  cancelBtn: { position: "absolute", right: 20, paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: colors.ink0, fontSize: 15, fontWeight: "500" },
});
