import { isWeb } from "../platform/runtime";
import { getStorageItem, setStorageItem } from "../platform/storage";
import { ACCOUNTS_STORAGE_KEY } from "../constants/storage";
import { createUserMessages } from "../constants/userMessages";
import type { TranslationFunction } from "../i18n";
import type { Account } from "../types/account";
import { validateAccount } from "./account-validation";

// Account records use SecureStore on native and origin-scoped localStorage on web.
// Keep this helper limited to account data so native storage behavior stays unchanged.
export async function readAccountsStorage(): Promise<string | null> {
  return getStorageItem(ACCOUNTS_STORAGE_KEY);
}

export async function writeAccountsStorage(value: string, t: TranslationFunction): Promise<void> {
  const USER_MESSAGES = createUserMessages(t);
  if (isWeb) {
    if (typeof window === "undefined") {
      throw new Error(USER_MESSAGES.storage.browserUnavailable);
    }
  }
  await setStorageItem(ACCOUNTS_STORAGE_KEY, value);
}

/** Parse persisted account JSON without allowing malformed records into app state. */
export function parseStoredAccounts(value: string): {
  accounts: Account[];
  invalidCount: number;
  invalidContainer: boolean;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { accounts: [], invalidCount: 0, invalidContainer: true };
  }

  if (!Array.isArray(parsed)) {
    return { accounts: [], invalidCount: 0, invalidContainer: true };
  }

  const accounts = parsed.filter(validateAccount);
  return {
    accounts,
    invalidCount: parsed.length - accounts.length,
    invalidContainer: false,
  };
}

/** Persist account records through the platform-specific storage adapter. */
export async function writeAccountRecords(
  accounts: Account[],
  t: TranslationFunction,
): Promise<void> {
  await writeAccountsStorage(JSON.stringify(accounts), t);
}
