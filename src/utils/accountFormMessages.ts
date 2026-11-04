import {
  MAX_TOTP_PERIOD_SECONDS,
  MIN_TOTP_PERIOD_SECONDS,
  SUPPORTED_TOTP_DIGITS,
} from "../constants/totp";
import type { TranslationFunction } from "../i18n";
import { createUserMessages } from "../constants/userMessages";

/** Copy shown when required account fields are missing. */
export function getMissingAccountInfoMessage(editing: boolean, t: TranslationFunction): string {
  const messages = createUserMessages(t);
  return editing ? messages.account.missingEditingBody : messages.account.missingBody;
}

/** Copy shown when account OTP configuration is invalid. */
export function getInvalidOtpSettingsMessage(t: TranslationFunction): string {
  const messages = createUserMessages(t);
  return messages.account.invalidOtpBody(
    SUPPORTED_TOTP_DIGITS.join(", "),
    MIN_TOTP_PERIOD_SECONDS,
    MAX_TOTP_PERIOD_SECONDS,
  );
}

/** Copy shown when an account with the same service and name already exists. */
export function getDuplicateAccountMessage(t: TranslationFunction): string {
  return createUserMessages(t).account.duplicateBody;
}

/** Copy shown after a successful account save. */
export function getAccountSavedMessage(editing: boolean, t: TranslationFunction): string {
  const messages = createUserMessages(t);
  return editing ? messages.account.updatedBody : messages.account.addedBody;
}
