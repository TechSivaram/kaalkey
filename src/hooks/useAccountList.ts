import { useMemo, useState } from "react";
import type { Account } from "../types/account";
import { normalizeAccountText } from "../utils/accountText";
export type AccountSortBy = "service" | "account";

// Reuse the locale-aware comparator instead of constructing it on each search.
const ACCOUNT_COLLATOR = new Intl.Collator(undefined, { sensitivity: "base" });

/** Owns account-list search, sort preference, and derived visible rows. */
export function useAccountList(accounts: Account[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<AccountSortBy>("service");

  // Account identity text is normalized only when the account collection changes,
  // not on every keystroke in the search field.
  const normalizedAccounts = useMemo(
    () =>
      accounts.map((account) => ({
        account,
        issuer: normalizeAccountText(account.issuer),
        name: normalizeAccountText(account.name),
      })),
    [accounts],
  );

  // Sorting depends on the account collection and selected sort field, not the
  // search query. Cache it so typing filters an already ordered list instead
  // of sorting the entire collection on every keystroke.
  const sortedAccounts = useMemo(
    () =>
      [...normalizedAccounts].sort((a, b) =>
        ACCOUNT_COLLATOR.compare(
          sortBy === "service" ? a.issuer : a.name,
          sortBy === "service" ? b.issuer : b.name,
        ),
      ),
    [normalizedAccounts, sortBy],
  );

  const visibleAccounts = useMemo(() => {
    const query = normalizeAccountText(searchQuery, true);
    const visible: Account[] = [];

    // Build the final array in one pass instead of allocating an intermediate
    // filtered array and then a second mapped array on every search change.
    for (const { account, issuer, name } of sortedAccounts) {
      if (!query || issuer.includes(query) || name.includes(query)) {
        visible.push(account);
      }
    }

    return visible;
  }, [sortedAccounts, searchQuery]);

  return { searchQuery, setSearchQuery, sortBy, setSortBy, visibleAccounts };
}
