import "@/lib/crypto/random-polyfill";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SessionProvider } from "@/lib/auth/session";
import { colors } from "@/theme/tokens";

export default function RootLayout() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }),
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={client}>
        <SessionProvider>
          <StatusBar style="light" />
          {/* Each screen paints its own opaque background via <Screen> — this
              is just a safety-net fallback for anything that doesn't. */}
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg0 } }} />
        </SessionProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg0 },
});
