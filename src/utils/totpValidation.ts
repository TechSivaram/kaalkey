import {
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_ALGORITHMS,
  SUPPORTED_TOTP_DIGITS,
} from "../constants/totp";
import type { Account } from "../types/account";

/** Checks whether an imported or edited account uses a supported TOTP algorithm. */
export function isSupportedTotpAlgorithm(value: unknown): value is Account["algorithm"] {
  return SUPPORTED_TOTP_ALGORITHMS.includes(
    (value ?? "") as (typeof SUPPORTED_TOTP_ALGORITHMS)[number],
  );
}

/** Checks whether a TOTP digit count is supported. */
export function isSupportedTotpDigits(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    SUPPORTED_TOTP_DIGITS.includes(value as (typeof SUPPORTED_TOTP_DIGITS)[number])
  );
}

/** Checks whether a TOTP period is an integer within the app's supported bounds. */
export function isSupportedTotpPeriod(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= MIN_TOTP_PERIOD_SECONDS &&
    (value as number) <= MAX_TOTP_PERIOD_SECONDS
  );
}
