import type { TranslationFunction } from "../i18n";
import type { BackupMode } from "../types/backupMode";

/** Returns localized explanatory copy shown in the encrypted-backup dialog. */
export function getBackupModalDescription(
  mode: BackupMode,
  accountCount: number,
  t: TranslationFunction,
): string {
  if (mode === "export") {
    const accountLabel = t(accountCount === 1 ? "backupRestore.account" : "backupRestore.accounts");
    return t("backupRestore.exportDescription")
      .replace("{count}", String(accountCount))
      .replace("{accountLabel}", accountLabel);
  }

  return t("backupRestore.restoreDescription");
}
