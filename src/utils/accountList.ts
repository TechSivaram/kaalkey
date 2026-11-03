import type { Account } from "../types/account";
import { normalizeAccountText } from "./accountText";
import type { AccountSortBy } from "./accountListCriteria";

export type { AccountSortBy } from "./accountListCriteria";

/** Filter and sort account rows while computing normalized keys once per row. */
export function getVisibleAccounts(
  accounts: Account[],
  searchQuery: string,
  sortBy: AccountSortBy,
): Account[] {
  const query = normalizeAccountText(searchQuery, true);

  return accounts
    .map((account) => ({
      account,
      issuer: normalizeAccountText(account.issuer),
      name: normalizeAccountText(account.name),
      sortKey: sortBy === "service" ? account.issuer : account.name,
    }))
    .filter(({ issuer, name }) => !query || issuer.includes(query) || name.includes(query))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey, undefined, { sensitivity: "base" }))
    .map(({ account }) => account);
}
