import { BlurView } from "expo-blur";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CertifyIcon, HomeIcon, PassportsIcon, ProfileIcon } from "@/components/shell/TabIcons";
import { useSession } from "@/lib/auth/session";
import { colors } from "@/theme/tokens";

export default function TabsLayout() {
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accentTeal} />
      </View>
    );
  }
  if (!user) return <Redirect href="/" />;

  const showCertifierTab = user.role === "certifier" || user.role === "admin";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.ink0,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.tabBarOverlay} />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Home", tabBarIcon: ({ color, focused }) => <HomeIcon color={String(color)} active={focused} /> }}
      />
      <Tabs.Screen
        name="passports"
        options={{ title: "Passports", tabBarIcon: ({ color, focused }) => <PassportsIcon color={String(color)} active={focused} /> }}
      />
      <Tabs.Screen
        name="certification"
        options={{
          title: "Review",
          href: showCertifierTab ? undefined : null,
          tabBarIcon: ({ color, focused }) => <CertifyIcon color={String(color)} active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, focused }) => <ProfileIcon color={String(color)} active={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    borderTopWidth: 0,
    height: 88,
    paddingTop: 8,
    backgroundColor: "transparent",
  },
  tabBarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
});
