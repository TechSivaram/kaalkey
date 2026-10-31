import type { AppLanguage } from "../i18n";
import { translate } from "../i18n";

/** Returns the completion copy shown after a backup restore. */
export function getRestoreCompletionMessage(
  added: number,
  restored: number,
  language: AppLanguage,
): string {
  const skipped = restored - added;
  return translate(language, "backupRestore.restoreCompletionBody", { added, skipped });
}

/** Returns the confirmation copy shown before merging restored accounts. */
export function getRestoreConfirmationMessage(accountCount: number, language: AppLanguage): string {
  return translate(language, "backupRestore.mergeConfirmationBody", { count: accountCount });
}

/** Returns the password-length validation copy shown before backup encryption. */
export function getBackupPasswordValidationMessage(minLength: number): string {
  return `Choose at least ${minLength} characters. You will need this password to restore the backup.`;
}
