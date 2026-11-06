import { getStorageItem, setStorageItem } from "../platform/storage";
import { useMemo, useEffect, useState } from "react";
import { useAppLanguage } from "../i18n";
import { showUserMessage } from "../utils/user-message";
import { LEGAL_ACCEPTANCE_STORAGE_KEY } from "../constants/storage";
import { LEGAL_VERSION } from "../constants/legal";
import { createUserMessages } from "../constants/userMessages";

export function useLegalAcceptance() {
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
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
        const saved = await getStorageItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
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
      await setStorageItem(LEGAL_ACCEPTANCE_STORAGE_KEY, LEGAL_VERSION);
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
