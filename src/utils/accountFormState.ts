import {
  DEFAULT_TOTP_ALGORITHM,
  DEFAULT_TOTP_DIGITS,
  DEFAULT_TOTP_PERIOD_SECONDS,
} from "../constants/totp";
import type { Account } from "../types/account";

export type AccountFormDefaults = {
  issuer: string;
  accountName: string;
  secret: string;
  totpUrlInput: string;
  manualExpanded: boolean;
  otpAlgorithm: Account["algorithm"];
  otpDigits: number;
  otpPeriod: string;
};

export function getDefaultAccountFormValues(): AccountFormDefaults {
  return {
    issuer: "",
    accountName: "",
    secret: "",
    totpUrlInput: "",
    manualExpanded: false,
    otpAlgorithm: DEFAULT_TOTP_ALGORITHM,
    otpDigits: DEFAULT_TOTP_DIGITS,
    otpPeriod: String(DEFAULT_TOTP_PERIOD_SECONDS),
  };
}

export function createAccountCandidate({
  editingId,
  originalAccount,
  issuer,
  accountName,
  secret,
  otpAlgorithm,
  otpDigits,
  otpPeriod,
}: {
  editingId: string | null;
  originalAccount: Account | undefined;
  issuer: string;
  accountName: string;
  secret: string;
  otpAlgorithm: Account["algorithm"];
  otpDigits: number;
  otpPeriod: string;
}): Account {
  return {
    id: editingId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    issuer: issuer.trim(),
    name: accountName.trim(),
    secret: editingId ? (originalAccount?.secret ?? "") : secret,
    algorithm: originalAccount?.algorithm ?? otpAlgorithm,
    digits: originalAccount?.digits ?? otpDigits,
    period: originalAccount?.period ?? Number(otpPeriod),
  };
}
