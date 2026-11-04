import { useMemo, useCallback } from "react";
import { useAppLanguage } from "../i18n";
import * as Clipboard from "expo-clipboard";
import { showUserMessage } from "../utils/user-message";
import { createUserMessages } from "../constants/userMessages";

type HapticFeedback = (kind?: "selection" | "success" | "warning") => void;

/** Copies a valid TOTP code and provides the same success/error feedback as the home screen. */
export function useCodeClipboard(hapticFeedback: HapticFeedback) {
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
  const copyCode = useCallback(
    async (code: string) => {
      if (!/^\d{6,8}$/.test(code)) {
        return;
      }

      try {
        await Clipboard.setStringAsync(code);
        hapticFeedback("success");
        showUserMessage(USER_MESSAGES.clipboard.copiedTitle, USER_MESSAGES.clipboard.copiedBody);
      } catch {
        showUserMessage(USER_MESSAGES.clipboard.errorTitle, USER_MESSAGES.clipboard.errorBody);
      }
    },
    [hapticFeedback, USER_MESSAGES],
  );

  return { copyCode };
}
