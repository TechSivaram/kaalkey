import type { BackupMode } from "../types/backupMode";

/** Returns the explanatory copy shown in the encrypted-backup dialog. */
export function getBackupModalDescription(mode: BackupMode, accountCount: number): string {
  if (mode === "export") {
    const accountLabel = accountCount === 1 ? "account" : "accounts";
    return `Encrypt all ${accountCount} saved ${accountLabel} into a backup file. Choose a strong password and store the file somewhere private.`;
  }

  return "Choose your KaalKey backup file and password. New accounts will be added to your existing account list; existing accounts will stay as they are.";
}
