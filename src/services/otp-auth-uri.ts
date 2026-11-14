import type { Account } from "../types/account";
import { TOTP_URI_PREFIX } from "../constants/totp";

/** Build the otpauth URI used to represent an existing TOTP account as a QR code. */
export function createAccountOtpAuthUrl(account: Account): string {
  const label = `${encodeURIComponent(account.issuer)}:${encodeURIComponent(account.name)}`;
  const params = [
    `secret=${encodeURIComponent(account.secret)}`,
    `issuer=${encodeURIComponent(account.issuer)}`,
    `algorithm=${encodeURIComponent(account.algorithm)}`,
    `digits=${encodeURIComponent(String(account.digits))}`,
    `period=${encodeURIComponent(String(account.period))}`,
  ].join("&");
  return `${TOTP_URI_PREFIX}${label}?${params}`;
}
