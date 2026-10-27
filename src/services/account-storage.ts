import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { ACCOUNTS_STORAGE_KEY } from "../constants/storage";

// Account records use SecureStore on native and origin-scoped localStorage on web.
// Keep this helper limited to account data so native storage behavior stays unchanged.
export async function readAccountsStorage(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" ? window.localStorage.getItem(ACCOUNTS_STORAGE_KEY) : null;
  }
  return SecureStore.getItemAsync(ACCOUNTS_STORAGE_KEY);
}

export async function writeAccountsStorage(value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") throw new Error("Browser storage is unavailable.");
    window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(ACCOUNTS_STORAGE_KEY, value);
}
