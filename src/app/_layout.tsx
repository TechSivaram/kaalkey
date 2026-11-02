import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import * as ScreenCapture from "expo-screen-capture";
import ActivityOverlayModal from "../components/ActivityOverlayModal";
import { useAppLanguage } from "../i18n";
import { useGlobalActivity } from "../utils/globalActivity";

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

function GlobalActivityLoader() {
  const insets = useSafeAreaInsets();
  const { t, languageLoading, translationLoading } = useAppLanguage();
  const activity = useGlobalActivity();

  const message = languageLoading
    ? t("activity.loadingLanguages")
    : translationLoading
      ? t("activity.loadingTranslation")
      : activity.message;

  return (
    <ActivityOverlayModal
      insets={insets}
      activityMessage={message}
      visible={languageLoading || translationLoading || activity.active}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {Platform.OS !== "web" ? <NativeScreenCaptureGuard /> : null}
      <StatusBar hidden={false} style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalActivityLoader />
    </SafeAreaProvider>
  );
}
