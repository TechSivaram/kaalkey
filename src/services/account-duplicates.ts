import type { Account } from "../types/account";

/**
 * Returns whether an account with the same issuer and account name already exists.
 * Matching is case-insensitive and can exclude the account currently being edited.
 */
export function hasDuplicateAccount(
  accounts: Account[],
  issuer: string,
  name: string,
  excludeId?: string,
): boolean {
  const normalizedIssuer = issuer.toLowerCase();
  const normalizedName = name.toLowerCase();

  return accounts.some(
    (existing) =>
      existing.id !== excludeId &&
      existing.issuer.toLowerCase() === normalizedIssuer &&
      existing.name.toLowerCase() === normalizedName,
  );
}
