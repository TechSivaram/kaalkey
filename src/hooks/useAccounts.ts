import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
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
            Alert.alert("Storage data invalid", "Saved account data could not be read safely.");
          } else {
            if (mounted) setAccounts(result.accounts);
            if (result.invalidCount > 0) {
              Alert.alert(
                "Some saved accounts need attention",
                `${result.invalidCount} invalid account record(s) were not loaded. Valid accounts remain available. Consider creating a backup before making further changes.`,
              );
            }
          }
        }
      } catch {
        Alert.alert("Storage error", "Saved accounts could not be loaded.");
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
      showMessage(
        "Storage error",
        "Accounts could not be saved. Check browser storage availability and try again.",
      );
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
      showMessage("Missing information", getMissingAccountInfoMessage(Boolean(currentEditingId)));
      return;
    }
    if (currentEditingId && !originalAccount) {
      showMessage(
        "Account not found",
        "This account could not be found. Close the editor and try again.",
      );
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
      showMessage("Invalid OTP settings", getInvalidOtpSettingsMessage());
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
        showMessage("Account already exists", getDuplicateAccountMessage());
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
        showMessage("Account saved", getAccountSavedMessage(Boolean(currentEditingId)));
      }
    } catch {
      showMessage("Invalid secret key", "Please check that you entered a valid Base32 secret.");
    }
  }

  async function removeAccountConfirmed(id: string) {
    hapticFeedback("warning");
    const updated = accounts.filter((account) => account.id !== id);
    const saved = await saveAccounts(updated);
    if (saved) {
      showMessage("Account removed", "The account and its secret were removed from this device.");
    }
  }

  function deleteAccount(id: string) {
    const message = "This removes the account and its secret from this device.";
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`Remove account?\n\n${message}`)) void removeAccountConfirmed(id);
      return;
    }
    Alert.alert("Remove account?", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => void removeAccountConfirmed(id),
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
  };
}
