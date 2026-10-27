import type { Account } from "../types/account";

function accountIdentity(account: Account): string {
  return [
    account.issuer.trim().toLocaleLowerCase(),
    account.name.trim().toLocaleLowerCase(),
    account.secret.replace(/[\s-]/g, "").toUpperCase(),
    account.algorithm,
    String(account.digits),
    String(account.period),
  ].join("|");
}

/** Merge restored accounts while preserving existing accounts and skipping duplicates. */
export function mergeRestoredAccounts(
  existing: Account[],
  restored: Account[],
): { accounts: Account[]; added: number } {
  const merged = [...existing];
  const identities = new Set(merged.map(accountIdentity));
  const ids = new Set(merged.map((account) => account.id));
  let added = 0;

  for (const account of restored) {
    const key = accountIdentity(account);
    if (identities.has(key)) continue;

    let id = account.id;
    if (!id || ids.has(id)) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      while (ids.has(id)) id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    const safeAccount = { ...account, id };
    merged.push(safeAccount);
    identities.add(key);
    ids.add(id);
    added += 1;
  }

  return { accounts: merged, added };
}
