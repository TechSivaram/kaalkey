import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { showUserMessage } from "../utils/user-message";
import * as SecureStore from "expo-secure-store";

import { LEGAL_ACCEPTANCE_STORAGE_KEY } from "../constants/storage";
import { LEGAL_VERSION } from "../constants/legal";
import { USER_MESSAGES } from "../constants/userMessages";

export function useLegalAcceptance() {
  const [legalLoaded, setLegalLoaded] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);
  const [legalReviewVisible, setLegalReviewVisible] = useState(false);
  const [legalDocument, setLegalDocument] = useState<"privacy" | "terms">("privacy");
  const [legalSaving, setLegalSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadLegalAcceptance() {
      try {
        // expo-secure-store is native-only; use browser localStorage on web.
        const saved =
          Platform.OS === "web"
            ? typeof window !== "undefined"
              ? window.localStorage.getItem(LEGAL_ACCEPTANCE_STORAGE_KEY)
              : null
            : await SecureStore.getItemAsync(LEGAL_ACCEPTANCE_STORAGE_KEY);
        if (mounted) setLegalAccepted(saved === LEGAL_VERSION);
      } catch {
        // If the saved decision cannot be read, require acknowledgment again.
        if (mounted) setLegalAccepted(false);
      } finally {
        if (mounted) setLegalLoaded(true);
      }
    }

    void loadLegalAcceptance();
    return () => {
      mounted = false;
    };
  }, []);

  async function acceptLegalNotice() {
    if (!legalChecked || legalSaving) return;
    setLegalSaving(true);
    try {
      // Persist acceptance with a web-compatible store in browsers.
      if (Platform.OS === "web") {
        if (typeof window === "undefined") throw new Error("Browser storage is unavailable");
        window.localStorage.setItem(LEGAL_ACCEPTANCE_STORAGE_KEY, LEGAL_VERSION);
      } else {
        await SecureStore.setItemAsync(LEGAL_ACCEPTANCE_STORAGE_KEY, LEGAL_VERSION);
      }
      setLegalAccepted(true);
      setLegalReviewVisible(false);
      setLegalChecked(false);
    } catch {
      showUserMessage(
        USER_MESSAGES.legalAcceptance.saveFailedTitle,
        USER_MESSAGES.legalAcceptance.saveFailedBody,
      );
    } finally {
      setLegalSaving(false);
    }
  }

  return {
    legalLoaded,
    legalAccepted,
    legalChecked,
    setLegalChecked,
    legalReviewVisible,
    setLegalReviewVisible,
    legalDocument,
    setLegalDocument,
    legalSaving,
    acceptLegalNotice,
  };
}
