import { isDesktop, isWeb } from "../platform/runtime";
import { useMemo, useCallback, useEffect, useRef, useState } from "react";
import { useAppLanguage } from "../i18n";
import { Alert } from "react-native";
import { createUserMessages } from "../constants/userMessages";
import { showUserMessage, showUserConfirmation } from "../utils/user-message";
import type { Account } from "../types/account";
import {
  readAccountsStorage,
  writeAccountRecords,
  parseStoredAccounts,
} from "../services/account-storage";
import { normalizeBase32Secret } from "../utils/base32";
import { validateAccount } from "../services/account-validation";
import { hasDuplicateAccount } from "../services/account-duplicates";
import {
  getMissingAccountInfoMessage,
  getInvalidOtpSettingsMessage,
  getDuplicateAccountMessage,
  getAccountSavedMessage,
} from "../utils/accountFormMessages";
import { getDefaultAccountFormValues, createAccountCandidate } from "../utils/accountFormState";
type UseAccountsOptions = {
  showMessage: (title: string, message: string) => void;
  hapticFeedback: (kind?: "selection" | "success" | "warning") => void;
  setScannerVisible: (visible: boolean) => void;
  setModalVisible: (visible: boolean) => void;
};

// Initial form defaults are immutable primitives; keep the defaults object
// outside the hook so HomeScreen rerenders do not recreate it.
const INITIAL_FORM_DEFAULTS = getDefaultAccountFormValues();

export function useAccounts({
  showMessage,
  hapticFeedback,
  setScannerVisible,
  setModalVisible,
}: UseAccountsOptions) {
  const { t } = useAppLanguage();
  const USER_MESSAGES = useMemo(() => createUserMessages(t), [t]);
  const userMessagesRef = useRef(USER_MESSAGES);
  useEffect(() => {
    userMessagesRef.current = USER_MESSAGES;
  }, [USER_MESSAGES]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState("");
  const [accountName, setAccountName] = useState("");
  const [secret, setSecret] = useState("");
  const [totpUrlInput, setTotpUrlInput] = useState("");
  const [manualExpanded, setManualExpanded] = useState(false);
  const [otpAlgorithm, setOtpAlgorithm] = useState<Account["algorithm"]>(
    INITIAL_FORM_DEFAULTS.otpAlgorithm,
  );
  const [otpDigits, setOtpDigits] = useState<number>(INITIAL_FORM_DEFAULTS.otpDigits);
  const [otpPeriod, setOtpPeriod] = useState<string>(INITIAL_FORM_DEFAULTS.otpPeriod);

  const resetAccountForm = useCallback(() => {
    const defaults = getDefaultAccountFormValues();
    setIssuer(defaults.issuer);
    setAccountName(defaults.accountName);
    setSecret(defaults.secret);
    setTotpUrlInput(defaults.totpUrlInput);
    setManualExpanded(defaults.manualExpanded);
    setOtpAlgorithm(defaults.otpAlgorithm);
    setOtpDigits(defaults.otpDigits);
    setOtpPeriod(defaults.otpPeriod);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAccounts() {
      try {
        const saved = await readAccountsStorage();
        if (saved) {
          const result = parseStoredAccounts(saved);
          if (result.invalidContainer) {
            showUserMessage(
              userMessagesRef.current.account.storageInvalidTitle,
              userMessagesRef.current.account.storageInvalidBody,
            );
          } else {
            if (mounted) setAccounts(result.accounts);
            if (result.invalidCount > 0) {
              showUserMessage(
                userMessagesRef.current.account.someSavedAccountsNeedAttentionTitle,
                userMessagesRef.current.account.someSavedAccountsNeedAttentionBody(
                  result.invalidCount,
                ),
              );
            }
          }
        }
      } catch {
        showUserMessage(
          userMessagesRef.current.account.storageErrorTitle,
          userMessagesRef.current.account.storageErrorBody,
        );
      } finally {
        if (mounted) setLoaded(true);
      }
    }

    void loadAccounts();
    return () => {
      mounted = false;
    };
  }, []);

  const saveAccounts = useCallback(
    async (updated: Account[]): Promise<boolean> => {
      try {
        await writeAccountRecords(updated, t);
        setAccounts(updated);
        return true;
      } catch {
        showMessage(USER_MESSAGES.account.storageErrorTitle, USER_MESSAGES.account.saveErrorBody);
        return false;
      }
    },
    [showMessage, USER_MESSAGES, t],
  );

  const openAddAccount = useCallback(() => {
    hapticFeedback("selection");
    setEditingId(null);
    resetAccountForm();
    setModalVisible(true);
  }, [hapticFeedback, resetAccountForm, setEditingId, setModalVisible]);

  const openEditAccount = useCallback(
    (account: Account) => {
      hapticFeedback("selection");
      setEditingId(account.id);
      setIssuer(account.issuer);
      setAccountName(account.name);
      setSecret(account.secret);
      setOtpAlgorithm(account.algorithm);
      setOtpDigits(account.digits);
      setOtpPeriod(String(account.period));
      setModalVisible(true);
    },
    [
      hapticFeedback,
      setEditingId,
      setIssuer,
      setAccountName,
      setSecret,
      setOtpAlgorithm,
      setOtpDigits,
      setOtpPeriod,
      setModalVisible,
    ],
  );

  const saveAccount = useCallback(async () => {
    const currentEditingId = editingId;
    const originalAccount = currentEditingId
      ? accounts.find((account) => account.id === currentEditingId)
      : undefined;
    const normalizedSecret = currentEditingId
      ? (originalAccount?.secret ?? "")
      : normalizeBase32Secret(secret);
    const normalizedIssuer = issuer.trim();
    const normalizedName = accountName.trim();

    if (!normalizedIssuer || !normalizedName || !normalizedSecret) {
      showMessage(
        USER_MESSAGES.account.missingTitle,
        getMissingAccountInfoMessage(Boolean(currentEditingId), t),
      );
      return;
    }
    if (currentEditingId && !originalAccount) {
      showMessage(USER_MESSAGES.account.notFoundTitle, USER_MESSAGES.account.notFoundBody);
      return;
    }

    // Editing is intentionally limited to issuer/service and account name.
    // Preserve the original secret and OTP configuration from storage.
    const candidate = createAccountCandidate({
      editingId: currentEditingId,
      originalAccount,
      issuer: normalizedIssuer,
      accountName: normalizedName,
      secret: normalizedSecret,
      otpAlgorithm,
      otpDigits,
      otpPeriod,
    });

    if (!validateAccount(candidate)) {
      showMessage(USER_MESSAGES.account.invalidOtpTitle, getInvalidOtpSettingsMessage(t));
      return;
    }

    try {
      if (
        hasDuplicateAccount(
          accounts,
          normalizedIssuer,
          normalizedName,
          currentEditingId ?? undefined,
        )
      ) {
        showMessage(USER_MESSAGES.account.duplicateTitle, getDuplicateAccountMessage(t));
        return;
      }

      const updated: Account[] = currentEditingId
        ? accounts.map((existing) => (existing.id === currentEditingId ? candidate : existing))
        : [...accounts, candidate];
      const saved = await saveAccounts(updated);

      if (saved) {
        hapticFeedback("success");
        resetAccountForm();
        setEditingId(null);
        setScannerVisible(false);
        setModalVisible(false);
        showMessage(
          USER_MESSAGES.account.savedTitle,
          getAccountSavedMessage(Boolean(currentEditingId), t),
        );
      }
    } catch {
      showMessage(
        USER_MESSAGES.account.invalidSecretTitle,
        USER_MESSAGES.account.invalidSecretBody,
      );
    }
  }, [
    editingId,
    accounts,
    issuer,
    accountName,
    secret,
    otpAlgorithm,
    otpDigits,
    otpPeriod,
    showMessage,
    saveAccounts,
    hapticFeedback,
    resetAccountForm,
    setEditingId,
    setScannerVisible,
    setModalVisible,
    USER_MESSAGES,
    t,
  ]);

  const removeAccountConfirmed = useCallback(
    async (id: string) => {
      hapticFeedback("warning");
      const updated = accounts.filter((account) => account.id !== id);
      const saved = await saveAccounts(updated);
      if (saved) {
        showMessage(USER_MESSAGES.account.removedTitle, USER_MESSAGES.account.removedBody);
      }
    },
    [hapticFeedback, accounts, saveAccounts, showMessage, USER_MESSAGES],
  );

  const deleteAccount = useCallback(
    (id: string) => {
      const message = USER_MESSAGES.account.removeConfirmBody;
      if (isDesktop) {
        void showUserConfirmation(
          USER_MESSAGES.account.removeConfirmTitle,
          message,
          USER_MESSAGES.account.removeButton,
          USER_MESSAGES.account.cancelButton,
          true,
        ).then((confirmed) => {
          if (confirmed) void removeAccountConfirmed(id);
        });
        return;
      }
      if (isWeb && typeof window !== "undefined") {
        if (window.confirm(`${USER_MESSAGES.account.removeConfirmWebTitle}\n\n${message}`))
          void removeAccountConfirmed(id);
        return;
      }
      Alert.alert(USER_MESSAGES.account.removeConfirmTitle, message, [
        { text: USER_MESSAGES.account.cancelButton, style: "cancel" },
        {
          text: USER_MESSAGES.account.removeButton,
          style: "destructive",
          onPress: () => void removeAccountConfirmed(id),
        },
      ]);
    },
    [removeAccountConfirmed, USER_MESSAGES],
  );

  const clearAllAccountsConfirmed = useCallback(async () => {
    hapticFeedback("warning");
    const saved = await saveAccounts([]);
    if (saved) {
      showMessage(USER_MESSAGES.account.clearedTitle, USER_MESSAGES.account.clearedBody);
    }
  }, [hapticFeedback, saveAccounts, showMessage, USER_MESSAGES]);

  const clearAllAccounts = useCallback(() => {
    const message = USER_MESSAGES.account.clearConfirmBody;
    const undoNote = USER_MESSAGES.account.clearConfirmUndoBody;
    if (isDesktop) {
      void showUserConfirmation(
        USER_MESSAGES.account.clearConfirmTitle,
        `${message}\n\n${undoNote}`,
        USER_MESSAGES.account.clearButton,
        USER_MESSAGES.account.cancelButton,
        true,
      ).then((confirmed) => {
        if (confirmed) void clearAllAccountsConfirmed();
      });
      return;
    }
    if (isWeb && typeof window !== "undefined") {
      if (
        window.confirm(`${USER_MESSAGES.account.clearConfirmTitle}\n\n${message}\n\n${undoNote}`)
      ) {
        void clearAllAccountsConfirmed();
      }
      return;
    }
    Alert.alert(USER_MESSAGES.account.clearConfirmTitle, `${message}\n\n${undoNote}`, [
      { text: USER_MESSAGES.account.cancelButton, style: "cancel" },
      {
        text: USER_MESSAGES.account.clearButton,
        style: "destructive",
        onPress: () => void clearAllAccountsConfirmed(),
      },
    ]);
  }, [clearAllAccountsConfirmed, USER_MESSAGES]);

  return {
    accounts,
    setAccounts,
    loaded,
    editingId,
    setEditingId,
    issuer,
    setIssuer,
    accountName,
    setAccountName,
    secret,
    setSecret,
    totpUrlInput,
    setTotpUrlInput,
    manualExpanded,
    setManualExpanded,
    otpAlgorithm,
    setOtpAlgorithm,
    otpDigits,
    setOtpDigits,
    otpPeriod,
    setOtpPeriod,
    saveAccounts,
    openAddAccount,
    openEditAccount,
    saveAccount,
    deleteAccount,
    clearAllAccounts,
  };
}
