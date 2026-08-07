import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { FloatingTabBar } from "@/components/shell/FloatingTabBar";
import { useSession } from "@/lib/auth/session";
import { colors } from "@/theme/tokens";

export default function TabsLayout() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg0 }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }
  if (!user) return <Redirect href="/" />;

  const showCertifierTab = user.role === "certifier" || user.role === "admin";

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Home" }} />
      <Tabs.Screen name="passports" options={{ title: "Passports" }} />
      <Tabs.Screen
        name="certification"
        options={{ title: "Review", href: showCertifierTab ? undefined : null }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
