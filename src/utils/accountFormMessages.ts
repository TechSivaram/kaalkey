import {
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_DIGITS,
} from "../constants/totp";

/** Copy shown when required account fields are missing. */
export function getMissingAccountInfoMessage(editing: boolean): string {
  return editing
    ? "Enter the service name and account name."
    : "Enter the service name, account name, and secret key.";
}

/** Copy shown when account OTP configuration is invalid. */
export function getInvalidOtpSettingsMessage(): string {
  return `Check the Base32 secret, algorithm, digit count, and refresh period. Secrets must contain valid Base32 characters; digits must be ${SUPPORTED_TOTP_DIGITS.join(", ")} and the period must be ${MIN_TOTP_PERIOD_SECONDS}–${MAX_TOTP_PERIOD_SECONDS} seconds.`;
}

/** Copy shown when an account with the same service and name already exists. */
export function getDuplicateAccountMessage(): string {
  return "An account with this service and account name is already saved.";
}

/** Copy shown after a successful account save. */
export function getAccountSavedMessage(editing: boolean): string {
  return editing ? "Your account was updated." : "Your account was added securely.";
}
