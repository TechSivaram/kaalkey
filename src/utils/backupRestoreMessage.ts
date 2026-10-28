/** Returns the completion copy shown after a backup restore. */
export function getRestoreCompletionMessage(added: number, restored: number): string {
  const addedLabel = added === 1 ? "account" : "accounts";
  const skipped = restored - added;
  const skippedLabel = skipped === 1 ? "account was" : "accounts were";
  return `Added ${added} ${addedLabel}. ${skipped} duplicate ${skippedLabel} skipped. Your existing accounts were kept.`;
}

/** Returns the confirmation copy shown before merging restored accounts. */
export function getRestoreConfirmationMessage(accountCount: number): string {
  const accountLabel = accountCount === 1 ? "account" : "accounts";
  return `This backup contains ${accountCount} ${accountLabel}. KaalKey will keep your existing accounts and add accounts from the backup that are not already present. Duplicate accounts will be skipped.`;
}

/** Returns the password-length validation copy shown before backup encryption. */
export function getBackupPasswordValidationMessage(minLength: number): string {
  return `Choose at least ${minLength} characters. You will need this password to restore the backup.`;
}
