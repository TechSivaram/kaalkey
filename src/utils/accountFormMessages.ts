import {
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_DIGITS,
} from "../constants/totp";
import { USER_MESSAGES } from "../constants/userMessages";

/** Copy shown when required account fields are missing. */
export function getMissingAccountInfoMessage(editing: boolean): string {
  return editing ? USER_MESSAGES.account.missingEditingBody : USER_MESSAGES.account.missingBody;
}

/** Copy shown when account OTP configuration is invalid. */
export function getInvalidOtpSettingsMessage(): string {
  return USER_MESSAGES.account.invalidOtpBody(
    SUPPORTED_TOTP_DIGITS.join(", "),
    MIN_TOTP_PERIOD_SECONDS,
    MAX_TOTP_PERIOD_SECONDS,
  );
}

/** Copy shown when an account with the same service and name already exists. */
export function getDuplicateAccountMessage(): string {
  return USER_MESSAGES.account.duplicateBody;
}

/** Copy shown after a successful account save. */
export function getAccountSavedMessage(editing: boolean): string {
  return editing ? USER_MESSAGES.account.updatedBody : USER_MESSAGES.account.addedBody;
}
