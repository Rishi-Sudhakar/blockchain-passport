import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CertifyIcon, HomeIcon, PassportsIcon, ProfileIcon } from "./TabIcons";
import { brutal, colors, radii } from "@/theme/tokens";

const icons: Record<string, typeof HomeIcon> = {
  dashboard: HomeIcon,
  passports: PassportsIcon,
  certification: CertifyIcon,
  profile: ProfileIcon,
};

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => {
    // `href` is an expo-router-specific extension to Tabs.Screen's options
    // (used to hide a tab, e.g. the certifier-only Review tab) that isn't
    // part of @react-navigation/bottom-tabs' own options type.
    const options = descriptors[route.key].options as { href?: string | null };
    return options.href !== null;
  });

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <View style={styles.barWrapper}>
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: brutal.shadowColor,
              borderRadius: radii.xl,
              transform: [{ translateX: brutal.shadowOffset }, { translateY: brutal.shadowOffset }],
            },
          ]}
        />
        <View style={styles.bar}>
          <View style={styles.row}>
            {visibleRoutes.map((route) => {
              const { options } = descriptors[route.key];
              const isFocused = state.routes[state.index].key === route.key;
              const Icon = icons[route.name] ?? HomeIcon;
              const label = typeof options.title === "string" ? options.title : route.name;
              const color = colors.ink0;

              const onPress = () => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable key={route.key} onPress={onPress} style={styles.item} hitSlop={8}>
                  {isFocused && <View style={styles.activeBlock} />}
                  <View style={styles.itemContent}>
                    <Icon color={color} active={isFocused} />
                    <Text style={[styles.label, { color }]} numberOfLines={1}>
                      {label.toUpperCase()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  barWrapper: {
    width: "100%",
  },
  bar: {
    height: 72,
    borderRadius: radii.xl,
    borderWidth: brutal.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.bg1,
    overflow: "hidden",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    padding: 6,
    gap: 6,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBlock: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: radii.md,
    backgroundColor: colors.yellow,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  itemContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
