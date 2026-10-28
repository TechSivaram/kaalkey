import { useMemo, useState } from "react";
import type { Account } from "../types/account";
import { getVisibleAccounts, type AccountSortBy } from "../utils/accountList";

export type { AccountSortBy } from "../utils/accountList";

/** Owns the account-list search, sort preference, and derived visible rows. */
export function useAccountList(accounts: Account[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<AccountSortBy>("service");

  const visibleAccounts = useMemo(
    () => getVisibleAccounts(accounts, searchQuery, sortBy),
    [accounts, searchQuery, sortBy],
  );

  return { searchQuery, setSearchQuery, sortBy, setSortBy, visibleAccounts };
}
