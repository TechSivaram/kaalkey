import { isAndroid, isIOS } from "../platform/runtime";
import { getStorageItem, setStorageItem } from "../platform/storage";
import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useAppLanguage } from "../i18n";
import { Vibration } from "react-native";
import { showUserMessage } from "../utils/user-message";
import { HAPTICS_ENABLED_STORAGE_KEY } from "../constants/storage";
import { createUserMessages } from "../constants/userMessages";

type HapticKind = "selection" | "success" | "warning";

/** Loads and persists the haptic preference and exposes best-effort feedback. */
export function useHaptics() {
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const enabledRef = useRef(true);

  useEffect(() => {
    let mounted = true;

    async function loadHapticPreference() {
      try {
        const saved = await getStorageItem(HAPTICS_ENABLED_STORAGE_KEY);
        const enabled = saved !== "false";
        enabledRef.current = enabled;
        if (mounted) setHapticsEnabled(enabled);
      } catch {
        enabledRef.current = true;
        if (mounted) setHapticsEnabled(true);
      }
    }

    void loadHapticPreference();
    return () => {
      mounted = false;
    };
  }, [USER_MESSAGES]);

  const hapticFeedback = useCallback((kind: HapticKind = "selection") => {
    if (!enabledRef.current) return;

    try {
      if (isAndroid) {
        const pattern =
          kind === "success" ? [0, 22, 45, 28] : kind === "warning" ? [0, 38, 55, 38] : 12;
        Vibration.vibrate(pattern);
      } else if (isIOS) {
        Vibration.vibrate(kind === "success" ? 35 : kind === "warning" ? 45 : 15);
      }
    } catch {
      // Haptic feedback is optional and must never interrupt account actions.
    }
  }, []);

  const toggleHaptics = useCallback(async () => {
    const next = !enabledRef.current;

    try {
      await setStorageItem(HAPTICS_ENABLED_STORAGE_KEY, String(next));
      enabledRef.current = next;
      setHapticsEnabled(next);
      if (next) hapticFeedback("success");
    } catch {
      showUserMessage(USER_MESSAGES.haptics.saveFailedTitle, USER_MESSAGES.haptics.saveFailedBody);
    }
  }, [hapticFeedback, USER_MESSAGES]);

  return { hapticsEnabled, toggleHaptics, hapticFeedback };
}
