import { isWeb } from "./runtime";
import * as SecureStore from "expo-secure-store";

/**
 * Shared asynchronous key-value storage.
 *
 * Native platforms use the OS-backed SecureStore implementation.
 * Web uses origin-scoped localStorage, matching KaalKey's existing behavior.
 * Keep platform-specific persistence decisions inside this module.
 */
export async function getStorageItem(key: string): Promise<string | null> {
  if (isWeb) {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  }

  return SecureStore.getItemAsync(key);
}

export async function setStorageItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof window === "undefined") {
      throw new Error("Browser storage is unavailable.");
    }

    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}
