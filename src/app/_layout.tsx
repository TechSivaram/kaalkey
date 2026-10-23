import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ScreenCapture from "expo-screen-capture";

export default function RootLayout() {
  // Keep native screen capture disabled for the entire app lifetime. On Android,
  // expo-screen-capture applies FLAG_SECURE, which also blanks recent-app previews.
  ScreenCapture.usePreventScreenCapture("kaalkey-sensitive-vault");

  useEffect(() => {
    // iOS needs an explicit privacy overlay for app-switcher/background snapshots.
    if (Platform.OS === "ios") {
      void ScreenCapture.enableAppSwitcherProtectionAsync(0.9).catch(() => {
        // The capture-prevention hook still blocks screenshots/recording where supported.
      });
    }
  }, []);

  return (
    <>
      <StatusBar hidden={false} style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
