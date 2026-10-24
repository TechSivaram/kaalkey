import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as ScreenCapture from "expo-screen-capture";

function NativeScreenCaptureGuard() {
  // Keep screen-capture protection on native platforms only. This hook is not
  // mounted on web because preventScreenCaptureAsync is unsupported there.
  ScreenCapture.usePreventScreenCapture("kaalkey-sensitive-vault");
  useEffect(() => {
    if (Platform.OS === "ios") {
      void ScreenCapture.enableAppSwitcherProtectionAsync(0.9).catch(() => {
        // Best-effort iOS privacy overlay.
      });
    }
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {Platform.OS !== "web" ? <NativeScreenCaptureGuard /> : null}
      <StatusBar hidden={false} style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
