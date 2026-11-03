import { useMemo, useState } from "react";
import type { Account } from "../types/account";
import { normalizeAccountText } from "../utils/accountText";
import type { AccountSortBy } from "../utils/accountList";

export type { AccountSortBy } from "../utils/accountList";

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

  const visibleAccounts = useMemo(() => {
    const query = normalizeAccountText(searchQuery, true);
    return normalizedAccounts
      .filter(({ issuer, name }) => !query || issuer.includes(query) || name.includes(query))
      .sort((a, b) =>
        ACCOUNT_COLLATOR.compare(
          sortBy === "service" ? a.issuer : a.name,
          sortBy === "service" ? b.issuer : b.name,
        ),
      )
      .map(({ account }) => account);
  }, [normalizedAccounts, searchQuery, sortBy]);

  return { searchQuery, setSearchQuery, sortBy, setSortBy, visibleAccounts };
}
