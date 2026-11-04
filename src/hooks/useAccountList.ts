import { useMemo, useState } from "react";
import type { Account } from "../types/account";
import { normalizeAccountText } from "../utils/accountText";
export type AccountSortBy = "service" | "account";

// Reuse the locale-aware comparator instead of constructing it on each search.
const ACCOUNT_COLLATOR = new Intl.Collator(undefined, { sensitivity: "base" });

type NormalizedAccountText = {
  issuerValue: string;
  nameValue: string;
  issuer: string;
  name: string;
};

// Account arrays are replaced when the collection changes, but most account
// objects remain identical. Cache normalized identity text by object so an
// edit/add/remove does not force normalization of every unchanged account.
// WeakMap keys allow removed account objects to be garbage-collected.
const NORMALIZED_ACCOUNT_TEXT = new WeakMap<Account, NormalizedAccountText>();

function getNormalizedAccountText(account: Account) {
  const cached = NORMALIZED_ACCOUNT_TEXT.get(account);
  if (
    cached &&
    cached.issuerValue === account.issuer &&
    cached.nameValue === account.name
  ) {
    return cached;
  }

  const normalized = {
    issuerValue: account.issuer,
    nameValue: account.name,
    issuer: normalizeAccountText(account.issuer),
    name: normalizeAccountText(account.name),
  };
  NORMALIZED_ACCOUNT_TEXT.set(account, normalized);
  return normalized;
}

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
        ...getNormalizedAccountText(account),
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
