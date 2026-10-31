import type { AppLanguage } from "../i18n";
import { translate } from "../i18n";
import type { BackupMode } from "../types/backupMode";

/** Returns localized explanatory copy shown in the encrypted-backup dialog. */
export function getBackupModalDescription(
  mode: BackupMode,
  accountCount: number,
  language: AppLanguage,
): string {
  if (mode === "export") {
    const accountLabel = translate(
      language,
      accountCount === 1 ? "backupRestore.account" : "backupRestore.accounts",
    );
    return translate(language, "backupRestore.exportDescription")
      .replace("{count}", String(accountCount))
      .replace("{accountLabel}", accountLabel);
  }

  return translate(language, "backupRestore.restoreDescription");
}
