import type { Account } from "../types/account";
import { normalizeAccountText } from "./accountText";

export type AccountSortBy = "service" | "account";

/** Checks whether an account matches a normalized account-list query. */
export function accountMatchesQuery(account: Account, query: string): boolean {
  return (
    !query ||
    normalizeAccountText(account.issuer).includes(query) ||
    normalizeAccountText(account.name).includes(query)
  );
}

/** Selects the display value used to sort an account row. */
export function getAccountSortValue(account: Account, sortBy: AccountSortBy): string {
  return sortBy === "service" ? account.issuer : account.name;
}
