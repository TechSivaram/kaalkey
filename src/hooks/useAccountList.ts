import { useMemo, useState } from "react";
import type { Account } from "../types/account";

export type AccountSortBy = "service" | "account";

/** Owns the account-list search, sort preference, and derived visible rows. */
export function useAccountList(accounts: Account[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<AccountSortBy>("service");

  const visibleAccounts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return accounts
      .filter(
        (account) =>
          !query ||
          account.issuer.toLowerCase().includes(query) ||
          account.name.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const first = sortBy === "service" ? a.issuer : a.name;
        const second = sortBy === "service" ? b.issuer : b.name;
        return first.localeCompare(second, undefined, { sensitivity: "base" });
      });
  }, [accounts, searchQuery, sortBy]);

  return { searchQuery, setSearchQuery, sortBy, setSortBy, visibleAccounts };
}
