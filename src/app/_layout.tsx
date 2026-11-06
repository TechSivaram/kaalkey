import { isIOS, isWeb } from "../platform/runtime";
import { useEffect } from "react";
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
    if (isIOS) {
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

  const visible = languageLoading || translationLoading || activity.active;

  // Mount the native Modal only when activity starts. If it is kept mounted
  // while hidden, an already-open Settings/Legal Modal can remain above it.
  // Conditional mounting presents this single root loader after the active dialog.
  return visible ? (
    <ActivityOverlayModal insets={insets} activityMessage={message} visible />
  ) : null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {!isWeb ? <NativeScreenCaptureGuard /> : null}
      <StatusBar hidden={false} style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalActivityLoader />
    </SafeAreaProvider>
  );
}
