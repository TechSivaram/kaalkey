import type { Account } from "../types/account";
import { normalizeAccountText } from "../utils/accountText";

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
  const normalizedIssuer = normalizeAccountText(issuer);
  const normalizedName = normalizeAccountText(name);

  return accounts.some(
    (existing) =>
      existing.id !== excludeId &&
      normalizeAccountText(existing.issuer) === normalizedIssuer &&
      normalizeAccountText(existing.name) === normalizedName,
  );
}
