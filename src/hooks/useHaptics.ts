import { getStorageItem, setStorageItem } from "../platform/storage";
import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useAppLanguage } from "../i18n";
import { showUserMessage } from "../utils/user-message";
import { HAPTICS_ENABLED_STORAGE_KEY } from "../constants/storage";
import { createUserMessages } from "../constants/userMessages";
import { triggerHapticFeedback } from "../platform/haptics/haptics";
import type { HapticKind } from "../platform/haptics/types";

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
      triggerHapticFeedback(kind);
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
