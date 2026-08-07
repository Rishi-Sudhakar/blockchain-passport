import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "@/lib/auth/session";
import { brutal, colors } from "@/theme/tokens";

export function TopBar({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.avatar} onPress={() => router.push("/(tabs)/profile")}>
        <Text style={styles.avatarText}>{user?.displayName.slice(0, 1).toUpperCase()}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink0 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentTeal,
    borderWidth: brutal.borderWidth - 0.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "800", color: colors.accentTealInk },
});
