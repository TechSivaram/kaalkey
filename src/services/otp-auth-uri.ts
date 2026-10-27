import type { Account } from "../types/account";
import { TOTP_URI_PREFIX } from "../constants/totp";

/** Build the otpauth URI used to represent an existing TOTP account as a QR code. */
export function createAccountOtpAuthUrl(account: Account): string {
  const label = `${encodeURIComponent(account.issuer)}:${encodeURIComponent(account.name)}`;
  const params = new URLSearchParams({
    secret: account.secret,
    issuer: account.issuer,
    algorithm: account.algorithm,
    digits: String(account.digits),
    period: String(account.period),
  });
  return `${TOTP_URI_PREFIX}${label}?${params.toString()}`;
}
