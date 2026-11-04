import * as OTPAuth from "otpauth";
import { isValidNormalizedBase32Secret, normalizeBase32Secret } from "../utils/base32";
import type { Account } from "../types/account";
import {
  isSupportedTotpAlgorithm,
  isSupportedTotpDigits,
  isSupportedTotpPeriod,
} from "../utils/totpValidation";

export function validateAccount(value: unknown): value is Account {
  if (!value || typeof value !== "object") return false;
  const account = value as Partial<Account>;
  if (
    typeof account.id !== "string" ||
    !account.id.trim() ||
    typeof account.issuer !== "string" ||
    !account.issuer.trim() ||
    typeof account.name !== "string" ||
    !account.name.trim() ||
    typeof account.secret !== "string" ||
    !isSupportedTotpAlgorithm(account.algorithm) ||
    !isSupportedTotpDigits(account.digits) ||
    !isSupportedTotpPeriod(account.period) ||
    (account.group !== undefined && typeof account.group !== "string")
  ) {
    return false;
  }

  const normalizedSecret = normalizeBase32Secret(account.secret);
  if (!isValidNormalizedBase32Secret(normalizedSecret)) return false;

  try {
    // Construction validates the OTPAuth configuration and Base32 secret.
    // Generating a real OTP here adds an unnecessary HMAC operation for every
    // saved account during startup and backup validation.
    new OTPAuth.TOTP({
      issuer: account.issuer,
      label: account.name,
      algorithm: account.algorithm as Account["algorithm"],
      digits: account.digits as number,
      period: account.period as number,
      secret: normalizedSecret,
    });
    return true;
  } catch {
    return false;
  }
}

export function validateAccounts(value: unknown): value is Account[] {
  return Array.isArray(value) && value.every(validateAccount);
}
