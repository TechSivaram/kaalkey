import { useCallback } from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";

type HapticFeedback = (kind?: "selection" | "success" | "warning") => void;

/** Copies a valid TOTP code and provides the same success/error feedback as the home screen. */
export function useCodeClipboard(hapticFeedback: HapticFeedback) {
  const copyCode = useCallback(
    async (code: string) => {
      if (!/^\d{6,8}$/.test(code)) {
        return;
      }

      try {
        await Clipboard.setStringAsync(code);
        hapticFeedback("success");
        Alert.alert("Code copied", "Your verification code has been copied.");
      } catch {
        Alert.alert("Error", "Could not copy the verification code.");
      }
    },
    [hapticFeedback],
  );

  return { copyCode };
}
