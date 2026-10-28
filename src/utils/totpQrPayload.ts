import { TOTP_URI_PREFIX } from "../constants/totp";

/** Removes invisible formatting characters and normalizes the legacy TOTP URI prefix. */
export function normalizeTotpQrPayload(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/^otpauth:\/\/totp\//i, TOTP_URI_PREFIX);
}

/** Returns whether a normalized payload is an authenticator TOTP setup URI. */
export function isTotpQrPayload(value: string): boolean {
  return normalizeTotpQrPayload(value).toLowerCase().startsWith(TOTP_URI_PREFIX);
}
