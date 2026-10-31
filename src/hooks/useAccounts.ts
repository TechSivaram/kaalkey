import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { USER_MESSAGES } from "../constants/userMessages";
import { showUserMessage } from "../utils/user-message";
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

export function useAccounts({
  showMessage,
  hapticFeedback,
  setScannerVisible,
  setModalVisible,
}: UseAccountsOptions) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState("");
  const [accountName, setAccountName] = useState("");
  const [secret, setSecret] = useState("");
  const [totpUrlInput, setTotpUrlInput] = useState("");
  const [manualExpanded, setManualExpanded] = useState(false);
  const formDefaults = getDefaultAccountFormValues();
  const [otpAlgorithm, setOtpAlgorithm] = useState<Account["algorithm"]>(formDefaults.otpAlgorithm);
  const [otpDigits, setOtpDigits] = useState<number>(formDefaults.otpDigits);
  const [otpPeriod, setOtpPeriod] = useState<string>(formDefaults.otpPeriod);

  function resetAccountForm() {
    const defaults = getDefaultAccountFormValues();
    setIssuer(defaults.issuer);
    setAccountName(defaults.accountName);
    setSecret(defaults.secret);
    setTotpUrlInput(defaults.totpUrlInput);
    setManualExpanded(defaults.manualExpanded);
    setOtpAlgorithm(defaults.otpAlgorithm);
    setOtpDigits(defaults.otpDigits);
    setOtpPeriod(defaults.otpPeriod);
  }

  useEffect(() => {
    let mounted = true;

    async function loadAccounts() {
      try {
        const saved = await readAccountsStorage();
        if (saved) {
          const result = parseStoredAccounts(saved);
          if (result.invalidContainer) {
            showUserMessage(
              USER_MESSAGES.account.storageInvalidTitle,
              USER_MESSAGES.account.storageInvalidBody,
            );
          } else {
            if (mounted) setAccounts(result.accounts);
            if (result.invalidCount > 0) {
              showUserMessage(
                USER_MESSAGES.account.someSavedAccountsNeedAttentionTitle,
                USER_MESSAGES.account.someSavedAccountsNeedAttentionBody(result.invalidCount),
              );
            }
          }
        }
      } catch {
        showUserMessage(
          USER_MESSAGES.account.storageErrorTitle,
          USER_MESSAGES.account.storageErrorBody,
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

  async function saveAccounts(updated: Account[]): Promise<boolean> {
    try {
      await writeAccountRecords(updated);
      setAccounts(updated);
      return true;
    } catch {
      showMessage(USER_MESSAGES.account.storageErrorTitle, USER_MESSAGES.account.saveErrorBody);
      return false;
    }
  }

  function openAddAccount() {
    hapticFeedback("selection");
    setEditingId(null);
    resetAccountForm();
    setModalVisible(true);
  }

  function openEditAccount(account: Account) {
    hapticFeedback("selection");
    setEditingId(account.id);
    setIssuer(account.issuer);
    setAccountName(account.name);
    setSecret(account.secret);
    setOtpAlgorithm(account.algorithm);
    setOtpDigits(account.digits);
    setOtpPeriod(String(account.period));
    setModalVisible(true);
  }

  async function saveAccount() {
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
        getMissingAccountInfoMessage(Boolean(currentEditingId)),
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
      showMessage(USER_MESSAGES.account.invalidOtpTitle, getInvalidOtpSettingsMessage());
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
        showMessage(USER_MESSAGES.account.duplicateTitle, getDuplicateAccountMessage());
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
          getAccountSavedMessage(Boolean(currentEditingId)),
        );
      }
    } catch {
      showMessage(
        USER_MESSAGES.account.invalidSecretTitle,
        USER_MESSAGES.account.invalidSecretBody,
      );
    }
  }

  async function removeAccountConfirmed(id: string) {
    hapticFeedback("warning");
    const updated = accounts.filter((account) => account.id !== id);
    const saved = await saveAccounts(updated);
    if (saved) {
      showMessage(USER_MESSAGES.account.removedTitle, USER_MESSAGES.account.removedBody);
    }
  }

  function deleteAccount(id: string) {
    const message = USER_MESSAGES.account.removeConfirmBody;
    if (Platform.OS === "web" && typeof window !== "undefined") {
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
  }

  async function clearAllAccountsConfirmed() {
    hapticFeedback("warning");
    const saved = await saveAccounts([]);
    if (saved) {
      showMessage(USER_MESSAGES.account.clearedTitle, USER_MESSAGES.account.clearedBody);
    }
  }

  function clearAllAccounts() {
    const message = USER_MESSAGES.account.clearConfirmBody;
    const undoNote = USER_MESSAGES.account.clearConfirmUndoBody;
    if (Platform.OS === "web" && typeof window !== "undefined") {
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
  }

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
