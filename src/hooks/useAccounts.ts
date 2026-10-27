import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import type { Account } from "../types/account";
import { readAccountsStorage, writeAccountsStorage } from "../services/account-storage";
import { normalizeBase32Secret, validateAccount } from "../services/account-validation";
import { hasDuplicateAccount } from "../services/account-duplicates";
import {
  DEFAULT_TOTP_ALGORITHM,
  DEFAULT_TOTP_DIGITS,
  DEFAULT_TOTP_PERIOD_SECONDS,
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_DIGITS,
} from "../constants/totp";

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
  const [otpAlgorithm, setOtpAlgorithm] = useState<Account["algorithm"]>(DEFAULT_TOTP_ALGORITHM);
  const [otpDigits, setOtpDigits] = useState<number>(DEFAULT_TOTP_DIGITS);
  const [otpPeriod, setOtpPeriod] = useState<string>(String(DEFAULT_TOTP_PERIOD_SECONDS));

  useEffect(() => {
    let mounted = true;

    async function loadAccounts() {
      try {
        const saved = await readAccountsStorage();
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const validAccounts = parsed.filter(validateAccount);
            if (mounted) setAccounts(validAccounts);
            if (validAccounts.length !== parsed.length) {
              Alert.alert(
                "Some saved accounts need attention",
                `${parsed.length - validAccounts.length} invalid account record(s) were not loaded. Valid accounts remain available. Consider creating a backup before making further changes.`,
              );
            }
          } else {
            Alert.alert("Storage data invalid", "Saved account data could not be read safely.");
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
      await writeAccountsStorage(JSON.stringify(updated));
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
    setIssuer("");
    setAccountName("");
    setSecret("");
    setTotpUrlInput("");
    setManualExpanded(false);
    setOtpAlgorithm(DEFAULT_TOTP_ALGORITHM);
    setOtpDigits(DEFAULT_TOTP_DIGITS);
    setOtpPeriod(String(DEFAULT_TOTP_PERIOD_SECONDS));
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
        "Missing information",
        currentEditingId
          ? "Enter the service name and account name."
          : "Enter the service name, account name, and secret key.",
      );
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
    const candidate: Account = {
      id: currentEditingId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      issuer: normalizedIssuer,
      name: normalizedName,
      secret: normalizedSecret,
      algorithm: originalAccount?.algorithm ?? otpAlgorithm,
      digits: originalAccount?.digits ?? otpDigits,
      period: originalAccount?.period ?? Number(otpPeriod),
    };

    if (!validateAccount(candidate)) {
      showMessage(
        "Invalid OTP settings",
        `Check the Base32 secret, algorithm, digit count, and refresh period. Secrets must contain valid Base32 characters; digits must be ${SUPPORTED_TOTP_DIGITS.join(", ")} and the period must be ${MIN_TOTP_PERIOD_SECONDS}–${MAX_TOTP_PERIOD_SECONDS} seconds.`,
      );
      return;
    }

    try {
      if (hasDuplicateAccount(accounts, normalizedIssuer, normalizedName, currentEditingId ?? undefined)) {
        showMessage(
          "Account already exists",
          "An account with this service and account name is already saved.",
        );
        return;
      }

      const updated: Account[] = currentEditingId
        ? accounts.map((existing) => (existing.id === currentEditingId ? candidate : existing))
        : [...accounts, candidate];
      const saved = await saveAccounts(updated);

      if (saved) {
        hapticFeedback("success");
        setIssuer("");
        setAccountName("");
        setSecret("");
        setOtpAlgorithm(DEFAULT_TOTP_ALGORITHM);
        setOtpDigits(DEFAULT_TOTP_DIGITS);
        setOtpPeriod(String(DEFAULT_TOTP_PERIOD_SECONDS));
        setEditingId(null);
        setScannerVisible(false);
        setModalVisible(false);
        showMessage(
          "Account saved",
          currentEditingId ? "Your account was updated." : "Your account was added securely.",
        );
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
