import type { TranslationFunction } from "../i18n";

/** Returns the completion copy shown after a backup restore. */
export function getRestoreCompletionMessage(
  added: number,
  restored: number,
  t: TranslationFunction,
): string {
  const skipped = restored - added;
  return t("backupRestore.restoreCompletionBody", { added, skipped });
}

/** Returns the confirmation copy shown before merging restored accounts. */
export function getRestoreConfirmationMessage(
  accountCount: number,
  t: TranslationFunction,
): string {
  return t("backupRestore.mergeConfirmationBody", { count: accountCount });
}
