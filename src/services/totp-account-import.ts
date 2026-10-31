import * as OTPAuth from "otpauth";
import { USER_MESSAGES } from "../constants/userMessages";
import type { Account } from "../types/account";
import { validateAccount } from "./account-validation";
import {
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_ALGORITHMS,
  SUPPORTED_TOTP_DIGITS,
} from "../constants/totp";

/** Parse and validate an authenticator TOTP URI into a KaalKey account. */
export function parseTotpAccountFromUri(uri: string): Account {
  const parsedUri = OTPAuth.URI.parse(uri);
  if (!(parsedUri instanceof OTPAuth.TOTP)) {
    throw new Error(USER_MESSAGES.totpImport.invalidTotpCode);
  }

  const normalizedName = parsedUri.label?.trim();
  const normalizedIssuer = parsedUri.issuer?.trim() || "Authenticator";
  const normalizedSecret = parsedUri.secret.base32;
  const algorithm = parsedUri.algorithm;

  if (!normalizedName || !normalizedSecret) {
    throw new Error(USER_MESSAGES.totpImport.missingAccountDetails);
  }
  if (
    !SUPPORTED_TOTP_ALGORITHMS.includes(algorithm as (typeof SUPPORTED_TOTP_ALGORITHMS)[number])
  ) {
    throw new Error(USER_MESSAGES.totpImport.unsupportedAlgorithm);
  }
  if (
    !Number.isInteger(parsedUri.digits) ||
    !SUPPORTED_TOTP_DIGITS.includes(parsedUri.digits as (typeof SUPPORTED_TOTP_DIGITS)[number])
  ) {
    throw new Error(USER_MESSAGES.totpImport.unsupportedDigits);
  }
  if (
    !Number.isInteger(parsedUri.period) ||
    parsedUri.period < MIN_TOTP_PERIOD_SECONDS ||
    parsedUri.period > MAX_TOTP_PERIOD_SECONDS
  ) {
    throw new Error(USER_MESSAGES.totpImport.unsupportedPeriod);
  }

  const account: Account = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    issuer: normalizedIssuer,
    name: normalizedName,
    secret: normalizedSecret,
    algorithm: algorithm as Account["algorithm"],
    digits: parsedUri.digits,
    period: parsedUri.period,
  };
  if (!validateAccount(account)) throw new Error(USER_MESSAGES.totpImport.invalidAccount);
  return account;
}
