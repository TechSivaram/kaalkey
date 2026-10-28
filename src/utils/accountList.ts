import type { Account } from "../types/account";
import { normalizeAccountText } from "./accountText";
import { accountMatchesQuery, getAccountSortValue } from "./accountListCriteria";
import type { AccountSortBy } from "./accountListCriteria";

export type { AccountSortBy } from "./accountListCriteria";

/** Filter and sort account rows using the current list controls. */
export function getVisibleAccounts(
  accounts: Account[],
  searchQuery: string,
  sortBy: AccountSortBy,
): Account[] {
  const query = normalizeAccountText(searchQuery, true);

  return accounts
    .filter((account) => accountMatchesQuery(account, query))
    .sort((a, b) =>
      getAccountSortValue(a, sortBy).localeCompare(getAccountSortValue(b, sortBy), undefined, {
        sensitivity: "base",
      }),
    );
}
